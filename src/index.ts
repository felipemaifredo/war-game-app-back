// Libs
import { Elysia, t } from "elysia"
import { cors } from "@elysiajs/cors"

// Imports
import { 
  RoomTypes, 
  validateAttack, 
  resolveAttack,
  validateReinforce,
  validateMove,
  advancePhase,
  calculateReinforcements,
  forceNextTurn,
  TURN_DURATION_MS,
  validateTransferConquest
} from "./game/validator"

// Types

// Consts
const GAME_CONFIG = {
  INITIAL_TROOPS: 1,             // Quantidade de tropas que começam em cada território
  TERRITORIES_PER_PLAYER: 0,     // Territórios por jogador (se 0, divide todos os disponíveis igualmente)
  NEUTRAL_OWNER_ID: "neutral"    // Dono dos territórios que sobrarem
}

const rooms: Record<string, RoomTypes> = {}

// Helpers
const generateId = () => crypto.randomUUID().slice(0, 8)
const PLAYER_COLORS = ["blue", "red", "green", "black", "yellow", "purple"];

// Main
const app = new Elysia()
  .use(cors())
  .post("/rooms/create", () => {
    const roomId = generateId()
    rooms[roomId] = {
      id: roomId,
      ownerId: "",
      status: "waiting",
      players: [],
      currentPlayer: "",
      phase: "reinforce",
      map: [],
      troopsToDeploy: 0
    }
    return { roomId }
  })
  .post("/rooms/join", ({ body, set, server }) => {
    const { roomId, name, avatar } = body
    const room = rooms[roomId]

    if (!room) {
      set.status = 404
      return { error: "Room not found" }
    }

    const existingPlayer = room.players.find(p => p.name === name);
    if (existingPlayer) {
      // Reconexão baseada no nome (atualiza o avatar caso o usuário tenha mudado)
      if (avatar) existingPlayer.avatar = avatar;
      return { playerId: existingPlayer.id };
    }

    if (room.status !== "waiting") {
      set.status = 400
      return { error: "Room already playing" }
    }
    if (room.players.length >= 6) {
      set.status = 400
      return { error: "Room is full" }
    }

    const playerId = generateId()
    if (room.players.length === 0) {
      room.ownerId = playerId
    }

    const playerIndex = room.players.length;
    room.players.push({
      id: playerId,
      name,
      objective: "Em breve",
      color: PLAYER_COLORS[playerIndex] || "gray",
      isOnline: false,
      avatar: avatar || "🥷"
    })

    // Notify others via WS that someone joined or game started
    server?.publish(roomId, JSON.stringify({
      type: "GAME_UPDATED",
      gameState: room
    }))

    return { playerId }
  }, {
    body: t.Object({
      roomId: t.String(),
      name: t.String(),
      avatar: t.Optional(t.String())
    })
  })
  .ws("/ws/:roomId", {
    query: t.Object({
      playerId: t.Optional(t.String())
    }),
    body: t.Object({
      action: t.String(),
      from: t.Optional(t.String()),
      to: t.Optional(t.String()),
      playerId: t.Optional(t.String()),
      amount: t.Optional(t.Number())
    }),
    params: t.Object({
      roomId: t.String()
    }),
    open(ws: any) {
      const roomId = ws.data.params.roomId
      const playerId = ws.data.query.playerId
      ws.subscribe(roomId)
      
      const room = rooms[roomId]
      if (room) {
        if (playerId) {
          const player = room.players.find((p: any) => p.id === playerId)
          if (player) player.isOnline = true
        }

        ws.send({
          type: "GAME_UPDATED",
          gameState: room
        })
        ws.publish(roomId, {
          type: "GAME_UPDATED",
          gameState: room
        })
      }
    },
    message(ws: any, message: any) {
      const roomId = ws.data.params.roomId
      const room = rooms[roomId]

      if (!room) {
        ws.send({ error: "Room not found" })
        return
      }

      const broadcastUpdate = (lastAction?: any) => {
        const updateMessage = { type: "GAME_UPDATED", gameState: room, lastAction }
        ws.send(updateMessage)
        ws.publish(roomId, updateMessage)
      }

      if (message.action === "START_GAME" && message.playerId === room.ownerId) {
        if (room.players.length >= 2) {
          room.status = "playing"
          room.currentPlayer = room.players[0].id
          room.phase = "reinforce"
          room.turnEndsAt = Date.now() + TURN_DURATION_MS;
          
          // Nomes de todos os territórios divididos por continentes
          const territoryNames = [
            "brasil", "argentina", "venezuela", "peru",
            "mexico", "california", "nova_iorque", "labrador", "ottawa", "vancouver", "mackenzie", "alasca", "groenlandia",
            "islandia", "inglaterra", "suecia", "alemanha", "franca", "polonia", "moscou",
            "argelia", "egito", "congo", "sudao", "madagascar", "africa_do_sul",
            "oriente_medio", "aral", "omsk", "dudinka", "siberia", "tchita", "mongolia", "vladivostok", "china", "india", "japao", "vietna",
            "borneu", "sumatra", "nova_guine", "australia"
          ]
          // Embaralhar territórios (Fisher-Yates)
          for (let i = territoryNames.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [territoryNames[i], territoryNames[j]] = [territoryNames[j], territoryNames[i]];
          }

          // Distribuir entre os jogadores
          room.map = territoryNames.map((tName, index) => {
            let playerOwnerId = GAME_CONFIG.NEUTRAL_OWNER_ID;
            
            if (GAME_CONFIG.TERRITORIES_PER_PLAYER === 0) {
              playerOwnerId = room.players[index % room.players.length].id;
            } else {
              const maxDistributed = room.players.length * GAME_CONFIG.TERRITORIES_PER_PLAYER;
              if (index < maxDistributed) {
                playerOwnerId = room.players[index % room.players.length].id;
              }
            }

            return {
              id: tName,
              ownerId: playerOwnerId,
              troops: GAME_CONFIG.INITIAL_TROOPS
            }
          })

          room.troopsToDeploy = calculateReinforcements(room, room.currentPlayer)

          broadcastUpdate()
        } else {
          ws.send({ error: "Necessário pelo menos 2 jogadores para iniciar." })
        }
        return
      }

      if (message.action === "RESET_GAME" && message.playerId === room.ownerId) {
        room.status = "waiting"
        room.map = []
        room.currentPlayer = ""
        room.phase = "reinforce"
        room.troopsToDeploy = 0
        broadcastUpdate()
        return
      }

      if (message.action === "END_PHASE" && message.playerId === room.currentPlayer) {
        advancePhase(room)
        broadcastUpdate()
        return
      }

      if (message.action === "REINFORCE" && message.playerId && message.to) {
        const validation = validateReinforce(room, message.playerId, message.to)
        if (validation.error) {
          ws.send({ error: validation.error })
          return
        }

        const amount = message.amount || 1;
        if (amount < 1 || amount > room.troopsToDeploy) {
          ws.send({ error: "Quantidade inválida." })
          return
        }

        validation.territory!.troops += amount
        room.troopsToDeploy -= amount
        
        if (room.troopsToDeploy === 0) {
          advancePhase(room)
        }
        
        broadcastUpdate({ type: "REINFORCE_RESULT", territory: message.to })
        return
      }

      if (message.action === "MOVE" && message.playerId && message.from && message.to) {
        const validation = validateMove(room, message.playerId, message.from, message.to)
        if (validation.error) {
          ws.send({ error: validation.error })
          return
        }

        const amount = message.amount || 1;
        if (amount < 1 || validation.fromTerritory!.troops - amount < 1) {
          ws.send({ error: "Quantidade inválida. O território de origem deve manter pelo menos 1 tropa." })
          return
        }

        validation.fromTerritory!.troops -= amount
        validation.toTerritory!.troops += amount

        broadcastUpdate({ type: "MOVE_RESULT", from: message.from, to: message.to })
        return
      }

      if (message.action === "TRANSFER_CONQUEST" && message.playerId && message.from && message.to) {
        const validation = validateTransferConquest(room, message.playerId, message.from, message.to)
        if (validation.error) {
          ws.send({ error: validation.error })
          return
        }

        const amount = message.amount !== undefined ? message.amount : 1;
        
        if (amount === 0) {
          // Se não quiser transferir tropas adicionais, apenas responde sucesso e encerra a etapa
          broadcastUpdate({ type: "TRANSFER_CONQUEST_RESULT", from: message.from, to: message.to })
          return
        }

        if (amount < 0 || validation.fromTerritory!.troops - amount < 1) {
          ws.send({ error: "Quantidade inválida. O território de origem deve manter pelo menos 1 tropa." })
          return
        }

        validation.fromTerritory!.troops -= amount
        validation.toTerritory!.troops += amount

        broadcastUpdate({ type: "TRANSFER_CONQUEST_RESULT", from: message.from, to: message.to })
        return
      }

      if (message.action === "ATTACK" && message.from && message.to && message.playerId) {
        const validation = validateAttack(room, message.playerId, message.from, message.to)
        
        if (validation.error) {
          ws.send({ error: validation.error })
          return
        }

        const result = resolveAttack(validation.fromTerritory!, validation.toTerritory!)
        broadcastUpdate({ type: "ATTACK_RESULT", result })
        return
      }
    },
    close(ws: any) {
      const roomId = ws.data.params.roomId
      const playerId = ws.data.query.playerId
      const room = rooms[roomId]

      ws.unsubscribe(roomId)

      if (room && playerId) {
        if (room.status === "waiting") {
          room.players = room.players.filter((p: any) => p.id !== playerId)
          if (room.ownerId === playerId && room.players.length > 0) {
            room.ownerId = room.players[0].id
          }
        } else if (room.status === "playing") {
          const player = room.players.find((p: any) => p.id === playerId)
          if (player) {
            player.isOnline = false
            
            // Se era a vez dele e ele saiu, passa a vez
            if (room.currentPlayer === playerId) {
              advancePhase(room)
            }
          }
        }
        
        ws.publish(roomId, { type: "GAME_UPDATED", gameState: room })
      }
    }
  })
  .listen(3000)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)

// Game Loop: Auto-skip turns when time runs out
setInterval(() => {
  for (const roomId in rooms) {
    const room = rooms[roomId];
    if (room.status === "playing" && room.turnEndsAt && Date.now() > room.turnEndsAt) {
      forceNextTurn(room);
      app.server?.publish(roomId, JSON.stringify({ 
        type: "GAME_UPDATED", 
        gameState: room 
      }));
    }
  }
}, 1000);
