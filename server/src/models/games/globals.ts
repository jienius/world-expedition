/* ALL Game Mode Global Params */
export const MAX_ROUND_SCORE = 20037501; // (Circumference of equator)*(1/2) in meters + 1
export const GAME_STATUS_CREATED = "created";
export const GAME_STATUS_STARTED = "started";
export const GAME_STATUS_ENDED = "ended";
export const GAME_STATUS_CANCELLED = "cancelled";

/* Game Mode String Literal Definitions */
export const GAME_MODE_SINGLEPLAYER = "singleplayer";
export const GAME_MODE_HIDENSEEK = "hide-n-seek";
export const GAME_MODE_COMPETITIVE = "competitive";
export const GAME_MODE_COOP = "co-op";
export const GAME_MODE_JOIN = "join"; // Interim game mode to join a private match before it's known what type it is

/* Hide-and-Seek Game Mode Params */
export const NUM_PLAYERS_HIDENSEEK = 2;
export const ROUND_TIME_LIMIT_HIDENSEEK = 0; // Default no time limit
export const NUM_ROUNDS_HIDENSEEK = 3;
export const ENABLE_MOVEMENT_HIDENSEEK = true;
export const HIDENSEEK_ROUND_SETUP_PHASE = 'setup'
export const HIDENSEEK_ROUND_PLAY_PHASE = 'play'

/* Co-op Game Mode Params */
export const NUM_PLAYERS_COOP = 2;
export const ROUND_TIME_LIMIT_COOP = 10;
export const NUM_ROUNDS_COOP = 3;
export const ENABLE_MOVEMENT_COOP = true;

/* Competitive Game Mode Params */
export const NUM_PLAYERS_COMPETITIVE = 2;
export const ROUND_TIME_LIMIT_COMPETITIVE = 10;
export const NUM_ROUNDS_COMPETITIVE = 3;
export const ENABLE_MOVEMENT_COMPETITIVE = true;

export interface GameObject {
    users: { username: string, checkedIn: boolean, socketID?: string }[],
    numberOfRound: number,
    enableMovement: boolean,
    scores: any,
    gameType: string,
    currentRound: number,
    gameID: string,
    latLngData: { lat: number, lng: number }[]
    currentPhase: string,
    gameStatus: string
}
