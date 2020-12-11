import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import http from "http";
import socketio from "socket.io";

import indexRouter = require("./controller/index");
import usersRouter = require("./controller/restapi/users");
import SocketHandler = require("./controller/sockets/socketHandler");
import corsSocketOptions from "./corsOption/corsSocket";
import { ChatSystemServer } from "./models/chat/chat-server";
import dbClient from "./controller/database/db";
import appStatus from "./appStatus";
import { MongoClient } from "mongodb";
import envConfig from "./environments/environment";
import {
  GAME_STATUS_CANCELLED,
  GAME_STATUS_ENDED,
} from "./models/games/globals";

const app = express();

const serverHttp = http.createServer(app);
const io = socketio(serverHttp, corsSocketOptions);

const chatServerInstance = new ChatSystemServer();

// this is only run when the server restarts
function initServer(mongoClient: MongoClient) {
  // currently set every user to offline status for now by wiping all the sockets
  const userCollection = mongoClient
    .db(envConfig.db_default_db)
    .collection("users");
  const gameCollection = mongoClient
    .db(envConfig.db_default_db)
    .collection("games");
  const requestCollection = mongoClient
    .db(envConfig.db_default_db)
    .collection("requests");
  const userPromise = userCollection.updateMany(
    {},
    {
      $set: {
        onlineStatus: false,
        sockets: [],
      },
    }
  );

  const gamePromise = gameCollection.updateMany(
    { gameStatus: { $ne: GAME_STATUS_ENDED } },
    {
      $set: {
        gameStatus: GAME_STATUS_CANCELLED,
      },
    }
  );

  const requestPromise = requestCollection.updateMany(
    {},
    {
      $set: {
        incGameRequests: [],
      },
    }
  );

  return Promise.all([userPromise, gamePromise, requestPromise]);
}

// connect to the database first
dbClient.connect((err, mongoClient) => {
  initServer(mongoClient).then((result) => {
    io.on("connection", (socket) => {
      console.log("a user connected", socket.id);
      SocketHandler.default.load_chat_events(socket, io);
      SocketHandler.default.load_auth_events(socket, io, mongoClient);
      SocketHandler.default.load_game_request_events(socket, io, mongoClient);
      SocketHandler.default.load_game_events(socket, io, mongoClient);
      SocketHandler.default.load_stats_events(socket, io, mongoClient);
      SocketHandler.default.load_friends_events(socket, io, mongoClient);
      SocketHandler.default.load_insights_events(socket, io, mongoClient);
    });
    app.set("io", io);
  });
});

// const theApp = app; // for restAPi
const theApp = serverHttp; // for socket
export = theApp;
