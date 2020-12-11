import { MongoClient } from "mongodb";
import socketio from "socket.io";
import { ChatSystemServer } from "../../models/chat/chat-server";
import gameRequestHandler from "./game-requests/game-request";
import gamesHandler from "./games/games";
import authHandler from "./login/login";
import friendHandler from "./friend-requests/friend-request";
import chatHandler from "./chat/chat";
import statsHandler from "./stats/stats";
import insightHandler from "./insight/insight";

const SocketHandler = {
  load_chat_events(
    socket: socketio.Socket,
    io: socketio.Server
  ) {
    chatHandler(socket, io);
  },

  // for when the user logs in and logs out, they will listen to a specific chatroom
  load_auth_events(
    socket: socketio.Socket,
    io: socketio.Server,
    mongoClient: MongoClient
  ) {
    authHandler(socket, io, mongoClient);
  },

  load_game_request_events(
    socket: socketio.Socket,
    io: socketio.Server,
    mongoClient: MongoClient
  ) {
    gameRequestHandler(socket, io, mongoClient);
  },

  load_game_events(
    socket: socketio.Socket,
    io: socketio.Server,
    mongoClient: MongoClient
  ) {
    gamesHandler(socket, io, mongoClient);
  },

  load_friends_events(
    socket: socketio.Socket,
    io: socketio.Server,
    mongoClient: MongoClient
  ) {
    friendHandler(socket, io, mongoClient);
  },
  load_stats_events(
    socket: socketio.Socket,
    io: socketio.Server,
    mongoClient: MongoClient
  ) {
    statsHandler(socket, io, mongoClient);
  },

  load_insights_events(
    socket: socketio.Socket,
    io: socketio.Server,
    mongoClient: MongoClient
  ) {
    insightHandler(socket, io, mongoClient);
  },
};

export default SocketHandler;
