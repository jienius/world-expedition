import { MongoClient } from "mongodb";
import socketio from "socket.io";
import {
  GenericSocketIncMessage,
  SocketAuthUserLoggedInOut,
  SocketIncCommand,
  SocketIncMessageLogin,
  SocketIncNewMsg,
  SocketIncRegistration,
  SocketIncUpdateUserData,
  SocketIncValidateToken,
} from "../../../models/socket-in-message";
import envConfig from "./../../../environments/environment";
import { UserCollection } from "./../../../models/db/users";
import appStatus from "../../../appStatus";

const users = new Map();
const sessions = new Map();

export default function authHandler(
  socket: socketio.Socket,
  io: socketio.Server,
  mongoClient: MongoClient
) {
  function updateUserOnlineStatus(username: string, onlineStatus: boolean) {
    const collection = mongoClient
      .db(envConfig.db_default_db)
      .collection("users");
    // perform actions on the collection object
    const result = collection.updateOne(
      { user: username },

      {
        $setOnInsert: {
          user: username,
          profile: {
            win: 0,
            lose: 0,
          },
          friends: [],
          sockets: [],
        },
        $set: {
          onlineStatus,
        },
      },
      {
        upsert: true,
      }
    );

    // when the insert/update online status is done, update the socketID lists
    result
      .then((writeresult) => {
        // console.log('write result', writeresult)

        // logged in
        let socketResult = null;
        if (onlineStatus) {
          socketResult = collection.updateOne(
            { username },
            {
              $push: {
                sockets: socket.id,
              },
            }
          );
        } else {
          socketResult = collection.updateOne(
            { username },
            {
              $pull: {
                sockets: socket.id,
              },
            }
          );
        }
      })
      .catch((error) => {
        console.log("write error", error);
      })
      .finally(() => {
        console.log("done");
      });

    // these are for debugging, keep them here but uncomment when debugging
    // console.log('auth--user-logged-in', result);
    // result.then(writeresult => {
    //     console.log('write result', writeresult)
    // }).catch(error => {
    //     console.log('write error', error)
    // }).finally(() => {
    //     console.log('done')
    // });
  }

  socket.on("auth--user-logged-in", (data: SocketAuthUserLoggedInOut) => {
    console.log("auth--user-logged-in", data);
    if (data.username !== undefined) {
      socket.join(data.username);
      updateUserOnlineStatus(data.username, true);
      if (!sessions.get(socket.id)) {
        const cnt = users.get(data.username) ? users.get(data.username) : 0;
        if (cnt === 0) {
          appStatus.onlineUsers += 1;
        }
        users.set(data.username, cnt + 1);
      }
      sessions.set(socket.id, data.username);
      console.log(sessions);
      console.log(users);
    }
  });

  socket.on("disconnect", async () => {
    const username = sessions.get(socket.id);
    const cnt = users.get(username);
    if (cnt === 1) {
      appStatus.onlineUsers -= 1;
      users.delete(username);
    } else {
      users.set(username, cnt - 1);
    }
    sessions.delete(socket.id);
    console.log(sessions);
    console.log(users);
  });

  socket.on("auth--user-logged-out", (data: SocketAuthUserLoggedInOut) => {
    console.log("auth--user-logged-out", data);
    if (data.username) {
      socket.leave(data.username);
      updateUserOnlineStatus(data.username, false);
    }
  });

  socket.on("auth--user-signed-up", (data: SocketAuthUserLoggedInOut) => {
    console.log("auth--user-signed-up", data);
    if (data.username) {
      updateUserOnlineStatus(data.username, false);
    }
  });
}
