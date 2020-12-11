import { MongoClient } from "mongodb";
import socketio from "socket.io";
import envConfig from "./../../../environments/environment";
import appStatus from "../../../appStatus";

export default function insightHandler(
  socket: socketio.Socket,
  io: socketio.Server,
  mongoClient: MongoClient
) {
  socket.on("insight--get-insight", () => {
    const statsCollection = mongoClient
      .db(envConfig.db_default_db)
      .collection("stats");

    statsCollection.findOne({ statusID: "0" }).then((data) => {
      console.log(data);
      appStatus.finishedGames = data.finishedGames || 0;
      appStatus.totalRoundsPlayed = data.totalRoundsPlayed || 0;
      appStatus.singlePlayed = data.singlePlayed || 0;
      appStatus.hideAndSeekPlayed = data.hideAndSeekPlayed || 0;
      appStatus.competitivePlayed = data.competitivePlayed || 0;
      appStatus.coopPlayed = data.coopPlayed || 0;
      socket.emit("insight--get-insight-result", appStatus);
    });
  });
}
