import { Collection, MongoClient } from "mongodb";
import socketio from "socket.io";
import envConfig from "./../../../environments/environment";
import {
  GameRequestCreate,
  GetGameData,
  SocketIncMessageLogin,
  UpdateGameData,
  UpdateGameHideNSeekData,
} from "../../../models/socket-in-message";
import { AuthenticationSystem } from "./../../../businessLogic/authentication/auth";
import appStatus from "../../../appStatus";
import {
  GameObject,
  GAME_MODE_COMPETITIVE,
  GAME_MODE_COOP,
  GAME_MODE_HIDENSEEK,
  GAME_MODE_SINGLEPLAYER,
  GAME_STATUS_CANCELLED,
  GAME_STATUS_ENDED,
  HIDENSEEK_ROUND_PLAY_PHASE,
  HIDENSEEK_ROUND_SETUP_PHASE,
  MAX_ROUND_SCORE,
} from "./../../../models/games/globals";

export default function gamesHandler(
  socket: socketio.Socket,
  io: socketio.Server,
  mongodbClient: MongoClient
) {
  function getScore(
    guessedLatLng: { lat: number; lng: number },
    actualLatLng: { lat: number; lng: number }
  ): number {
    // https://cloud.google.com/blog/products/maps-platform/how-calculate-distances-map-maps-javascript-api
    // var R = 3958.8; // Radius of the Earth in miles
    const R = 6371.071; // Radius of the Earth in km
    let d = 1000;
    const rlat1 = guessedLatLng.lat * (Math.PI / 180); // Convert degrees to radians
    const rlat2 = actualLatLng.lat * (Math.PI / 180); // Convert degrees to radians
    const difflat = rlat2 - rlat1; // Radian difference (latitudes)
    const difflon = (actualLatLng.lng - guessedLatLng.lng) * (Math.PI / 180); // Radian difference (longitudes)
    d =
      2 *
      R *
      Math.asin(
        Math.sqrt(
          Math.sin(difflat / 2) * Math.sin(difflat / 2) +
            Math.cos(rlat1) *
              Math.cos(rlat2) *
              Math.sin(difflon / 2) *
              Math.sin(difflon / 2)
        )
      );
    console.log("score: ", d);
    return d;
  }

  socket.on("game--get-game-data", (data: GetGameData) => {
    console.log("game--get-game-data", data);
    const collection = mongodbClient
      .db(envConfig.db_default_db)
      .collection("games");
    socket.join(data.gameID);
    collection
      .findOne({ gameID: data.gameID })
      .then((gameData) => {
        socket.emit("game--get-game-data-result", gameData);
        socket.emit("game--round-start", {
          timeLimitPerRound: gameData.timeLimitPerRound,
          currentRound: gameData.currentRound,
        });
      })
      .catch((error) => {
        socket.emit("game--get-game-data-result", error);
      });
  });

  // for non-hidenseek games
  socket.on("game--update-game-data", async (data: UpdateGameData) => {
    const collection = mongodbClient
      .db(envConfig.db_default_db)
      .collection("games");
    console.log("game--update-game-data", data);
    const currentGame: GameObject = await collection.findOne({
      gameID: data.gameID,
    });

    // Update Scores with the user's guess
    const userIndex =
      "scores." + data.username + ".round-" + currentGame.currentRound;
    const userIndexGuessedLatLng =
      "gameGuessedLatLng." +
      data.username +
      ".round-" +
      currentGame.currentRound;
    const updateObject: any = {};
    const theScore = getScore(data.guessedLatLng, data.actualLatLng);
    updateObject[userIndex] = theScore;

    let totalScore = 0;
    for (let round = 1; round < data.numberOfRound + 1; round++) {
      if (round !== currentGame.currentRound) {
        const currentScore =
          currentGame.scores[data.username]["round-" + round];
        totalScore += currentScore;
      } else {
        totalScore += theScore;
      }
    }
    const userTotalScoreIndex = "scores." + data.username + ".totalScore";
    updateObject[userTotalScoreIndex] = totalScore;

    updateObject[userIndexGuessedLatLng] = data.guessedLatLng;
    await collection.updateOne(
      { gameID: data.gameID },
      {
        $set: updateObject,
      }
    );
    const updatedGame: GameObject = await collection.findOne({
      gameID: currentGame.gameID,
    });
    console.log("After updating score", updatedGame);
    if (updatedGame.currentRound < updatedGame.numberOfRound) {
      if (currentRoundIsComplete(updatedGame)) {
        const updatedRoundGame = await updateGameRound(updatedGame, collection);
        io.to(data.gameID).emit("game--get-game-data-result", updatedRoundGame);
        io.to(data.gameID).emit("game--round-start", {
          timeLimitPerRound: updatedRoundGame.timeLimitPerRound,
          currentRound: updatedGame.currentRound + 1,
        });
      } else {
        io.to(data.gameID).emit("game--get-game-data-result", updatedGame);
        io.to(data.username).emit("game--waiting-on-other-players", {});
      }
    } else {
      if (currentRoundIsComplete(updatedGame)) {
        const updatedRoundGame = await updateGameRound(updatedGame, collection);
        await setGameEndStatus(updatedGame, collection);
        io.to(data.gameID).emit("game--end-game-data-result", updatedRoundGame);
        // io.to(data.gameID).emit("game--round-start", {
        //   timeLimitPerRound: updatedRoundGame.timeLimitPerRound,
        //   currentRound: updatedGame.currentRound + 1,
        //   // numberOfRound: updatedGame.numberOfRound,
        // });

        const stat = mongodbClient
          .db(envConfig.db_default_db)
          .collection("stats");
        stat.updateOne(
          { statusID: "0" },
          {
            $inc: {
              totalRoundsPlayed: updatedGame.numberOfRound,
              finishedGames: 1,
            },
          },
          { upsert: true }
        );
        appStatus.ongoingGames -= 1;
        switch (updatedGame.gameType) {
          case GAME_MODE_SINGLEPLAYER:
            stat.updateOne(
              { statusID: "0" },
              {
                $inc: {
                  singlePlayed: 1,
                },
              },
              { upsert: true }
            );
            break;
          case GAME_MODE_COMPETITIVE:
            stat.updateOne(
              { statusID: "0" },
              {
                $inc: {
                  competitivePlayed: 1,
                },
              },
              { upsert: true }
            );
            break;
          case GAME_MODE_COOP:
            stat.updateOne(
              { statusID: "0" },
              {
                $inc: {
                  coopPlayed: 1,
                },
              },
              { upsert: true }
            );
            break;
        }
      } else {
        io.to(data.gameID).emit("game--get-game-data-result", updatedGame);
        io.to(data.username).emit("game--waiting-on-other-players", {});
      }
    }
  });

  // for hidenseek games
  socket.on(
    "game--update-hidenseek-game-data",
    async (data: UpdateGameHideNSeekData) => {
      console.log("game--update-hidenseek-game-data", data);

      const collection = mongodbClient
        .db(envConfig.db_default_db)
        .collection("games");

      const currentGame: GameObject = await collection.findOne({
        gameID: data.gameID,
      });

      // Update Scores with the user's guess

      // -------------------------------------------------------------------------------------
      if (currentGame.currentPhase === HIDENSEEK_ROUND_SETUP_PHASE) {
        // Loop through game players -> The player != current player -> update latLongData
        for (const user of currentGame.users) {
          if (user.username !== data.username) {
            const currentLatLngData: any = {
              latLngData: currentGame.latLngData,
            };
            currentLatLngData.latLngData[user.username][
              "round-" + currentGame.currentRound
            ] = { lat: data.placedLatLng.lat, lng: data.placedLatLng.lng };
            await collection.updateOne(
              { gameID: data.gameID },
              {
                $set: currentLatLngData,
              }
            );
          }
        }
      } else if (currentGame.currentPhase === HIDENSEEK_ROUND_PLAY_PHASE) {
        const userIndex =
          "scores." + data.username + ".round-" + currentGame.currentRound;
        const updateObject: any = {};

        const theScore = getScore(data.guessedLatLng, data.actualLatLng);
        updateObject[userIndex] = theScore;

        let totalScore = 0;
        for (let round = 1; round < data.numberOfRound + 1; round++) {
          if (round !== currentGame.currentRound) {
            const currentScore =
              currentGame.scores[data.username]["round-" + round];
            totalScore += currentScore;
          } else {
            totalScore += theScore;
          }
        }

        const userTotalScoreIndex = "scores." + data.username + ".totalScore";
        updateObject[userTotalScoreIndex] = totalScore;

        const userIndexGuessedLatLng =
          "gameGuessedLatLng." +
          data.username +
          ".round-" +
          currentGame.currentRound;
        updateObject[userIndexGuessedLatLng] = data.guessedLatLng;

        await collection.updateOne(
          { gameID: data.gameID },
          {
            $set: updateObject,
          }
        );
      } else {
        console.log(
          "SERVER ERROR: Unexpected Hide and Seek game phase: " +
            currentGame.currentPhase
        );
      }

      const updatedGame: GameObject = await collection.findOne({
        gameID: currentGame.gameID,
      });

      console.log("After phase update:", updatedGame);
      // End Game States
      if (
        updatedGame.currentRound >= updatedGame.numberOfRound &&
        updatedGame.currentPhase === HIDENSEEK_ROUND_PLAY_PHASE
      ) {
        if (currentPhaseIsComplete(updatedGame, currentGame.currentPhase)) {
          const updatedRoundGame = await updateGameRound(
            updatedGame,
            collection
          );
          await setGameEndStatus(updatedGame, collection);
          io.to(data.gameID).emit(
            "game--end-game-data-result",
            updatedRoundGame
          );
          appStatus.ongoingGames -= 1;
          const stat = mongodbClient
            .db(envConfig.db_default_db)
            .collection("stats");
          stat.updateOne(
            { statusID: "0" },
            {
              $inc: {
                totalRoundsPlayed: updatedGame.numberOfRound,
                finishedGames: 1,
                hideAndSeekPlayed: 1,
              },
            },
            { upsert: true }
          );
          // io.to(data.gameID).emit('game--phase-start', {});
        } else {
          io.to(data.gameID).emit("game--get-game-data-result", updatedGame);
          io.to(data.username).emit("game--waiting-on-other-players", {
            currentPhase: updatedGame.currentPhase,
          });
        }
      }
      // Keep Advancing the Game
      else {
        if (currentPhaseIsComplete(updatedGame, currentGame.currentPhase)) {
          const updatedRoundGame = await updateGameRound(
            updatedGame,
            collection
          );
          io.to(data.gameID).emit(
            "game--get-game-data-result",
            updatedRoundGame
          );
          io.to(data.gameID).emit("game--phase-start", {
            currentPhase: updatedGame.currentPhase,
            currentRound: updatedGame.currentRound,
          });
        } else {
          io.to(data.gameID).emit("game--get-game-data-result", updatedGame);
          io.to(data.username).emit("game--waiting-on-other-players", {
            currentPhase: updatedGame.currentPhase,
          });
        }
      }
    }
  );

  function currentRoundIsComplete(currentGame: GameObject) {
    let retVal = true;
    for (const user of currentGame.users) {
      if (
        currentGame.scores[user.username][
          "round-" + currentGame.currentRound
        ] === MAX_ROUND_SCORE
      ) {
        retVal = false;
        break;
      }
    }
    return retVal;
  }

  function currentPhaseIsComplete(currentGame: GameObject, phase: string) {
    let retVal = true;

    if (phase === HIDENSEEK_ROUND_SETUP_PHASE) {
      // Check all Lat-Longs have been set
      for (const user of currentGame.users) {
        if (currentGame.latLngData.hasOwnProperty(user.username)) {
          const currentLatLngData: any = currentGame.latLngData;
          const currLat =
            currentLatLngData[user.username][
              "round-" + currentGame.currentRound
            ].lat;
          const currLng =
            currentLatLngData[user.username][
              "round-" + currentGame.currentRound
            ].lng;
          // if there is a player that doesn't have both currLat and currLng defined (default) then the phase hasn't ended
          if (
            currLat === undefined ||
            currLat === null ||
            currLng === undefined ||
            currLng === null
          ) {
            retVal = false;
            break;
          }
        } else {
          console.log("SERVER ERROR: UNEXPECTED STATE 2");
        }
      }
    } else {
      // Check all scores have been set
      for (const user of currentGame.users) {
        if (currentGame.scores.hasOwnProperty(user.username)) {
          if (
            currentGame.scores[user.username][
              "round-" + currentGame.currentRound
            ] === MAX_ROUND_SCORE
          ) {
            retVal = false;
            break;
          }
        } else {
          console.log("SERVER ERROR: UNEXPECTED STATE 3");
        }
      }
    }

    return retVal;
  }

  async function setGameEndStatus(
    currentGame: GameObject,
    collection: Collection<any>
  ) {
    await collection.updateOne(
      { gameID: currentGame.gameID },
      {
        $set: {
          gameStatus: GAME_STATUS_ENDED,
        },
      }
    );
  }

  async function updateGameRound(
    currentGame: GameObject,
    collection: Collection<any>
  ): Promise<any> {
    const updateObject: any = {
      currentRound: currentGame.currentRound,
    };

    switch (currentGame.gameType) {
      case GAME_MODE_SINGLEPLAYER:
        updateObject.currentRound =
          currentGame.currentRound < currentGame.numberOfRound
            ? currentGame.currentRound + 1
            : currentGame.currentRound;
        break;
      case GAME_MODE_COMPETITIVE:
        if (currentRoundIsComplete(currentGame)) {
          updateObject.currentRound =
            currentGame.currentRound < currentGame.numberOfRound
              ? currentGame.currentRound + 1
              : currentGame.currentRound;
        }
        break;
      case GAME_MODE_COOP:
        if (currentRoundIsComplete(currentGame)) {
          updateObject.currentRound =
            currentGame.currentRound < currentGame.numberOfRound
              ? currentGame.currentRound + 1
              : currentGame.currentRound;
        }
        break;
      case GAME_MODE_HIDENSEEK:
        if (currentPhaseIsComplete(currentGame, currentGame.currentPhase)) {
          if (currentGame.currentPhase === HIDENSEEK_ROUND_PLAY_PHASE) {
            updateObject.currentRound =
              currentGame.currentRound < currentGame.numberOfRound
                ? currentGame.currentRound + 1
                : currentGame.currentRound;
          }
          updateObject.currentPhase =
            currentGame.currentPhase === HIDENSEEK_ROUND_SETUP_PHASE
              ? HIDENSEEK_ROUND_PLAY_PHASE
              : HIDENSEEK_ROUND_SETUP_PHASE;
        }
        break;
      default:
        console.log(
          "SERVER ERROR: Unhandled currentGame.gameType: '" +
            currentGame.gameType +
            "' in 'game--update-game-data' socket event"
        );
        break;
    }

    await collection.updateOne(
      { gameID: currentGame.gameID },
      {
        $set: updateObject,
      }
    );

    return await collection.findOne({ gameID: currentGame.gameID });
  }
}
