interface AppStatus {
  onlineUsers: number;
  ongoingGames: number;
  finishedGames: number;
  totalRoundsPlayed: number;
  singlePlayed: number;
  hideAndSeekPlayed: number;
  competitivePlayed: number;
  coopPlayed: number;
}

const appStatus: AppStatus = {
  onlineUsers: 0,
  ongoingGames: 0,
  finishedGames: 0,
  totalRoundsPlayed: 0,
  singlePlayed: 0,
  hideAndSeekPlayed: 0,
  competitivePlayed: 0,
  coopPlayed: 0,
};

export default appStatus;
