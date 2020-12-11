export interface GenericSocketIncMessage {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

export interface SocketIncMessageLogin {
  username: string;
  password: string;
}

export interface GameRequestCreate extends SocketAuthUserLoggedInOut {
  roundTimeLimit: number,
  numberOfRounds: number,
  enableMovement: boolean,
  players: { username: string, checkedIn: boolean, socketID?: string }[],
  gameType: string
}

export interface GameRequestJoin extends SocketAuthUserLoggedInOut {
  gameID: string,
  gameType: string,
}

export interface GameRequestCancel extends SocketAuthUserLoggedInOut {
  gameID: string,    // Can be undefined - allows hosts to boot all players
  gameType: string
}

export interface SocketIncValidateToken {
  token: string;
}

export interface SocketIncUpdateUserData {
  user: {
    username: string;
    password: string;
  };
  userData: {
    [key: string]: string;
  };
}

export interface SocketIncRegistration {
  name: string;
  gender: string;
  birthdate: string;
  address: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
}

export interface SocketIncNewMsg extends GenericSocketIncMessage {
  message: string;
}

export interface SocketIncCommand extends GenericSocketIncMessage {
  command: string;
  commandParam: string;
}

export interface SocketAuthUserLoggedInOut {
  username: string;
}

export interface GetGameData extends SocketAuthUserLoggedInOut {
  gameID: string;
}

export interface UpdateGameData extends SocketAuthUserLoggedInOut {
  gameID: string,
  currentRound: number,
  numberOfRound: number,
  guessedLatLng: {
    lat: number,
    lng: number
  },
  actualLatLng: {
    lat: number,
    lng: number
  },
  gameType: string
}

export interface UpdateGameHideNSeekData extends SocketAuthUserLoggedInOut {
  gameID: string,
  currentRound: number,
  numberOfRound: number,
  guessedLatLng: {
    lat: number,
    lng: number
  },
  actualLatLng: {
    lat: number,
    lng: number
  },
  gameType: string,
  placedLatLng: {
    lat: number,
    lng: number
  }


}
export interface FriendRequestMessage {
  username: string,
  searchname: string,
  message: string
}

export interface ChatMessage {
  username: string,
  gameID: string,
  chatHistory: string
}

