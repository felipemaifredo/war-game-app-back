// Types
export type TerritoryTypes = {
  id: string
  ownerId: string
  troops: number
}

export type PlayerTypes = {
  id: string
  name: string
  objective: string
  color: string
  isOnline: boolean
  avatar?: string
}

export type RoomTypes = {
  id: string
  ownerId: string
  status: "waiting" | "playing"
  players: PlayerTypes[]
  currentPlayer: string
  phase: "reinforce" | "attack" | "move"
  map: TerritoryTypes[]
  troopsToDeploy: number
  turnEndsAt?: number
}

// Configs
export const TURN_DURATION_MS = 60000 // 1 minuto em milissegundos

// Funcs

export const calculateReinforcements = (room: RoomTypes, playerId: string) => {
  const ownedTerritories = room.map.filter((t) => t.ownerId === playerId).length
  // Mínimo de 1 tropa recebida, mesmo com 1 território só.
  return Math.max(1, Math.floor(ownedTerritories / 2))
}

export const forceNextTurn = (room: RoomTypes) => {
  const currentIndex = room.players.findIndex((p) => p.id === room.currentPlayer)
  
  // Procura o próximo jogador que ainda tem territórios
  let nextPlayerId = room.currentPlayer
  for (let i = 1; i <= room.players.length; i++) {
    const nextIndex = (currentIndex + i) % room.players.length
    const possibleNextPlayerId = room.players[nextIndex].id
    const possibleNextPlayerOnline = room.players[nextIndex].isOnline !== false
    const hasTerritories = room.map.some(t => t.ownerId === possibleNextPlayerId)
    
    if (hasTerritories && possibleNextPlayerOnline) {
      nextPlayerId = possibleNextPlayerId
      break
    }
  }

  room.currentPlayer = nextPlayerId
  room.phase = "reinforce"
  room.troopsToDeploy = calculateReinforcements(room, room.currentPlayer)
  room.turnEndsAt = Date.now() + TURN_DURATION_MS
}

export const advancePhase = (room: RoomTypes) => {
  if (room.phase === "reinforce") {
    room.phase = "attack"
  } else if (room.phase === "attack") {
    room.phase = "move"
  } else if (room.phase === "move") {
    forceNextTurn(room)
  }
}

export const validateReinforce = (
  room: RoomTypes,
  playerId: string,
  territoryId: string
) => {
  if (room.currentPlayer !== playerId) return { error: "Não é o seu turno." }
  if (room.phase !== "reinforce") return { error: "Não está na fase de posicionamento." }
  if (room.troopsToDeploy <= 0) return { error: "Você não tem mais tropas para posicionar." }

  const territory = room.map.find((t) => t.id === territoryId)
  if (!territory) return { error: "Território não encontrado." }
  if (territory.ownerId !== playerId) return { error: "Você não possui este território." }

  return { success: true, territory }
}

export const validateAttack = (
  room: RoomTypes,
  playerId: string,
  fromId: string,
  toId: string
) => {
  if (room.currentPlayer !== playerId) return { error: "Não é o seu turno." }
  if (room.phase !== "attack") return { error: "Não está na fase de ataque." }

  const fromTerritory = room.map.find((t) => t.id === fromId)
  const toTerritory = room.map.find((t) => t.id === toId)

  if (!fromTerritory || !toTerritory) return { error: "Território não encontrado." }
  if (fromTerritory.ownerId !== playerId) return { error: "Você não possui o território de origem." }
  if (toTerritory.ownerId === playerId) return { error: "Você não pode atacar seu próprio território." }
  if (fromTerritory.troops <= 1) return { error: "Tropas insuficientes para atacar (mínimo de 2)." }

  return { success: true, fromTerritory, toTerritory }
}

export const resolveAttack = (
  fromTerritory: TerritoryTypes,
  toTerritory: TerritoryTypes
) => {
  // Lógica de confronto: ou o atacante ganha (defensor perde 1) ou atacante perde (atacante perde 1)
  // Isso evita que ambos percam tropas ao mesmo tempo e o território de origem acabe zerado em ataques 2x1.
  let attackerLoss = 0
  let defenderLoss = 0
  
  const attackerWinsRound = Math.random() > 0.5
  if (attackerWinsRound) {
    defenderLoss = 1
  } else {
    attackerLoss = 1
  }

  fromTerritory.troops -= attackerLoss
  toTerritory.troops -= defenderLoss

  let conquered = false
  if (toTerritory.troops <= 0) {
    toTerritory.ownerId = fromTerritory.ownerId
    toTerritory.troops = 1 // Tropa que ocupa o novo território
    fromTerritory.troops -= 1
    conquered = true
  }

  return { attackerLoss, defenderLoss, conquered }
}

export const validateMove = (
  room: RoomTypes,
  playerId: string,
  fromId: string,
  toId: string
) => {
  if (room.currentPlayer !== playerId) return { error: "Não é o seu turno." }
  if (room.phase !== "move") return { error: "Não está na fase de remanejamento." }

  const fromTerritory = room.map.find((t) => t.id === fromId)
  const toTerritory = room.map.find((t) => t.id === toId)

  if (!fromTerritory || !toTerritory) return { error: "Território não encontrado." }
  if (fromTerritory.ownerId !== playerId) return { error: "A origem não te pertence." }
  if (toTerritory.ownerId !== playerId) return { error: "O destino não te pertence." }
  if (fromTerritory.troops <= 1) return { error: "O território de origem precisa manter pelo menos 1 tropa." }

  return { success: true, fromTerritory, toTerritory }
}

export const validateTransferConquest = (
  room: RoomTypes,
  playerId: string,
  fromId: string,
  toId: string
) => {
  if (room.currentPlayer !== playerId) return { error: "Não é o seu turno." }
  if (room.phase !== "attack") return { error: "Apenas durante a fase de ataque." }

  const fromTerritory = room.map.find((t) => t.id === fromId)
  const toTerritory = room.map.find((t) => t.id === toId)

  if (!fromTerritory || !toTerritory) return { error: "Território não encontrado." }
  if (fromTerritory.ownerId !== playerId) return { error: "A origem não te pertence." }
  if (toTerritory.ownerId !== playerId) return { error: "O destino não te pertence." }
  if (fromTerritory.troops <= 1) return { error: "O território de origem precisa manter pelo menos 1 tropa." }

  return { success: true, fromTerritory, toTerritory }
}
