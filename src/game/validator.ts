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

export const BORDERS: Record<string, string[]> = {
  "brasil": [
    "argentina",
    "venezuela",
    "peru",
    "argelia"
  ],
  "argentina": [
    "brasil",
    "peru"
  ],
  "venezuela": [
    "brasil",
    "peru",
    "mexico"
  ],
  "peru": [
    "brasil",
    "argentina",
    "venezuela"
  ],
  "mexico": [
    "california",
    "nova_iorque",
    "venezuela"
  ],
  "california": [
    "mexico",
    "nova_iorque",
    "vancouver"
  ],
  "nova_iorque": [
    "mexico",
    "california",
    "ottawa",
    "labrador",
    "groenlandia"
  ],
  "labrador": [
    "nova_iorque",
    "ottawa",
    "groenlandia"
  ],
  "ottawa": [
    "nova_iorque",
    "labrador",
    "vancouver",
    "mackenzie"
  ],
  "vancouver": [
    "california",
    "ottawa",
    "mackenzie",
    "alasca"
  ],
  "mackenzie": [
    "ottawa",
    "vancouver",
    "alasca",
    "groenlandia"
  ],
  "alasca": [
    "vancouver",
    "mackenzie",
    "vladivostok"
  ],
  "groenlandia": [
    "nova_iorque",
    "labrador",
    "mackenzie",
    "islandia"
  ],
  "islandia": [
    "groenlandia",
    "inglaterra",
    "suecia"
  ],
  "inglaterra": [
    "islandia",
    "franca",
    "alemanha",
    "suecia"
  ],
  "suecia": [
    "islandia",
    "inglaterra",
    "alemanha",
    "moscou"
  ],
  "alemanha": [
    "inglaterra",
    "suecia",
    "franca",
    "polonia",
    "moscou"
  ],
  "franca": [
    "inglaterra",
    "alemanha",
    "polonia",
    "argelia"
  ],
  "polonia": [
    "alemanha",
    "franca",
    "moscou",
    "oriente_medio",
    "egito"
  ],
  "moscou": [
    "suecia",
    "alemanha",
    "polonia",
    "oriente_medio",
    "aral",
    "omsk"
  ],
  "argelia": [
    "brasil",
    "franca",
    "egito",
    "congo",
    "sudao"
  ],
  "egito": [
    "argelia",
    "sudao",
    "oriente_medio",
    "polonia"
  ],
  "congo": [
    "argelia",
    "sudao",
    "africa_do_sul"
  ],
  "sudao": [
    "argelia",
    "egito",
    "congo",
    "africa_do_sul",
    "madagascar",
    "oriente_medio"
  ],
  "madagascar": [
    "sudao",
    "africa_do_sul"
  ],
  "africa_do_sul": [
    "congo",
    "sudao",
    "madagascar"
  ],
  "oriente_medio": [
    "egito",
    "sudao",
    "polonia",
    "moscou",
    "aral",
    "india"
  ],
  "aral": [
    "oriente_medio",
    "moscou",
    "omsk",
    "china",
    "india"
  ],
  "omsk": [
    "moscou",
    "aral",
    "dudinka",
    "siberia",
    "china"
  ],
  "dudinka": [
    "omsk",
    "siberia"
  ],
  "siberia": [
    "omsk",
    "dudinka",
    "tchita",
    "mongolia",
    "china"
  ],
  "tchita": [
    "siberia",
    "mongolia",
    "vladivostok"
  ],
  "mongolia": [
    "siberia",
    "tchita",
    "vladivostok",
    "china",
    "japao"
  ],
  "vladivostok": [
    "tchita",
    "mongolia",
    "japao",
    "alasca"
  ],
  "china": [
    "aral",
    "omsk",
    "siberia",
    "mongolia",
    "india",
    "vietna"
  ],
  "india": [
    "oriente_medio",
    "aral",
    "china",
    "vietna"
  ],
  "japao": [
    "mongolia",
    "vladivostok"
  ],
  "vietna": [
    "china",
    "india",
    "sumatra"
  ],
  "borneu": [
    "sumatra",
    "nova_guine",
    "australia"
  ],
  "sumatra": [
    "borneu",
    "australia",
    "vietna"
  ],
  "nova_guine": [
    "borneu",
    "australia"
  ],
  "australia": [
    "borneu",
    "sumatra",
    "nova_guine"
  ]
};

// Funcs

export const CONTINENT_BONUSES = [
  {
    id: "america_do_sul",
    countries: ["brasil", "argentina", "venezuela", "peru"],
    bonus: 2
  },
  {
    id: "africa",
    countries: ["argelia", "egito", "congo", "sudao", "madagascar", "africa_do_sul"],
    bonus: 3
  },
  {
    id: "america_do_norte",
    countries: ["mexico", "california", "nova_iorque", "labrador", "ottawa", "vancouver", "mackenzie", "alasca", "groenlandia"],
    bonus: 5
  },
  {
    id: "europa",
    countries: ["islandia", "inglaterra", "suecia", "alemanha", "franca", "polonia", "moscou"],
    bonus: 5
  },
  {
    id: "oceania",
    countries: ["borneu", "sumatra", "nova_guine", "australia"],
    bonus: 2
  },
  {
    id: "asia",
    countries: ["oriente_medio", "aral", "omsk", "dudinka", "siberia", "tchita", "mongolia", "vladivostok", "china", "india", "japao", "vietna"],
    bonus: 7
  }
];

export function calculateReinforcements (room: RoomTypes, playerId: string) {
  const ownedTerritoriesIds = room.map.filter((t) => t.ownerId === playerId).map(t => t.id)
  
  // Mínimo de 1 tropa recebida, mesmo com 1 território só.
  let reinforcements = Math.max(1, Math.floor(ownedTerritoriesIds.length / 2))
  
  for (const continent of CONTINENT_BONUSES) {
    const ownsWholeContinent = continent.countries.every(country => ownedTerritoriesIds.includes(country))
    if (ownsWholeContinent) {
      reinforcements += continent.bonus
    }
  }

  return reinforcements
}

export function forceNextTurn (room: RoomTypes) {
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

export function advancePhase (room: RoomTypes) {
  if (room.phase === "reinforce") {
    room.phase = "attack"
  } else if (room.phase === "attack") {
    room.phase = "move"
  } else if (room.phase === "move") {
    forceNextTurn(room)
  }
}

export function validateReinforce (
  room: RoomTypes,
  playerId: string,
  territoryId: string
) {
  if (room.currentPlayer !== playerId) return { error: "Não é o seu turno." }
  if (room.phase !== "reinforce") return { error: "Não está na fase de posicionamento." }
  if (room.troopsToDeploy <= 0) return { error: "Você não tem mais tropas para posicionar." }

  const territory = room.map.find((t) => t.id === territoryId)
  if (!territory) return { error: "Território não encontrado." }
  if (territory.ownerId !== playerId) return { error: "Você não possui este território." }

  return { success: true, territory }
}

export function validateAttack (
  room: RoomTypes,
  playerId: string,
  fromId: string,
  toId: string
) {
  if (room.currentPlayer !== playerId) return { error: "Não é o seu turno." }
  if (room.phase !== "attack") return { error: "Não está na fase de ataque." }

  const fromTerritory = room.map.find((t) => t.id === fromId)
  const toTerritory = room.map.find((t) => t.id === toId)

  if (!fromTerritory || !toTerritory) return { error: "Território não encontrado." }
  if (fromTerritory.ownerId !== playerId) return { error: "Você não possui o território de origem." }
  if (toTerritory.ownerId === playerId) return { error: "Você não pode atacar seu próprio território." }
  
  if (!BORDERS[fromId]?.includes(toId)) {
    return { error: "Os territórios não fazem fronteira." }
  }

  if (fromTerritory.troops <= 1) return { error: "Tropas insuficientes para atacar (mínimo de 2)." }

  return { success: true, fromTerritory, toTerritory }
}

export function resolveAttack (
  fromTerritory: TerritoryTypes,
  toTerritory: TerritoryTypes
) {
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

export function validateMove (
  room: RoomTypes,
  playerId: string,
  fromId: string,
  toId: string
) {
  if (room.currentPlayer !== playerId) return { error: "Não é o seu turno." }
  if (room.phase !== "move") return { error: "Não está na fase de remanejamento." }

  const fromTerritory = room.map.find((t) => t.id === fromId)
  const toTerritory = room.map.find((t) => t.id === toId)

  if (!fromTerritory || !toTerritory) return { error: "Território não encontrado." }
  if (fromTerritory.ownerId !== playerId) return { error: "A origem não te pertence." }
  if (toTerritory.ownerId !== playerId) return { error: "O destino não te pertence." }

  if (!BORDERS[fromId]?.includes(toId)) {
    return { error: "Os territórios não fazem fronteira." }
  }

  if (fromTerritory.troops <= 1) return { error: "O território de origem precisa manter pelo menos 1 tropa." }

  return { success: true, fromTerritory, toTerritory }
}

export function validateTransferConquest (
  room: RoomTypes,
  playerId: string,
  fromId: string,
  toId: string
) {
  if (room.currentPlayer !== playerId) return { error: "Não é o seu turno." }
  if (room.phase !== "attack") return { error: "Apenas durante a fase de ataque." }

  const fromTerritory = room.map.find((t) => t.id === fromId)
  const toTerritory = room.map.find((t) => t.id === toId)

  if (!fromTerritory || !toTerritory) return { error: "Território não encontrado." }
  if (fromTerritory.ownerId !== playerId) return { error: "A origem não te pertence." }
  if (toTerritory.ownerId !== playerId) return { error: "O destino não te pertence." }

  if (!BORDERS[fromId]?.includes(toId)) {
    return { error: "Os territórios não fazem fronteira." }
  }

  if (fromTerritory.troops <= 1) return { error: "O território de origem precisa manter pelo menos 1 tropa." }

  return { success: true, fromTerritory, toTerritory }
}
