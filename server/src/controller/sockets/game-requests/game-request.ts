import { MongoClient } from "mongodb";
import socketio from "socket.io";
import envConfig from "./../../../environments/environment";
import {
    GameRequestCancel,
    GameRequestCreate,
    GameRequestJoin,
    GetGameData,
    SocketAuthUserLoggedInOut,
    SocketIncMessageLogin,
} from "../../../models/socket-in-message";
import { AuthenticationSystem } from "./../../../businessLogic/authentication/auth";
import {
    MAX_ROUND_SCORE,
    GAME_MODE_SINGLEPLAYER,
    GAME_MODE_HIDENSEEK,
    GAME_MODE_COOP,
    GAME_MODE_COMPETITIVE,
    NUM_PLAYERS_HIDENSEEK,
    NUM_PLAYERS_COOP,
    NUM_PLAYERS_COMPETITIVE,
    ROUND_TIME_LIMIT_COOP,
    ROUND_TIME_LIMIT_COMPETITIVE,
    NUM_ROUNDS_HIDENSEEK,
    NUM_ROUNDS_COOP,
    NUM_ROUNDS_COMPETITIVE,
    HIDENSEEK_ROUND_PLAY_PHASE,
    HIDENSEEK_ROUND_SETUP_PHASE,
    GAME_MODE_JOIN,
    GAME_STATUS_CREATED,
    GAME_STATUS_STARTED,
    GAME_STATUS_ENDED,
    GAME_STATUS_CANCELLED,
    ROUND_TIME_LIMIT_HIDENSEEK,
    GameObject,
    ENABLE_MOVEMENT_COOP,
    ENABLE_MOVEMENT_COMPETITIVE,
    ENABLE_MOVEMENT_HIDENSEEK,
} from "./../../../models/games/globals";
import { UserCollection, RequestCollection } from "./../../../models/db/users";
import appStatus from "../../../appStatus";
import axios from "axios";

const QUEUE_HIDEANDSEEK: { username: string; socketID: string }[] = [];
const QUEUE_COMPETITIVE: { username: string; socketID: string }[] = [];
const QUEUE_COOP: { username: string; socketID: string }[] = [];

const QUEUE_LIST = [QUEUE_COMPETITIVE, QUEUE_COOP, QUEUE_HIDEANDSEEK];

// Default location returned if an error is encountered while generationg a location
const DEFAULT_LOC: { lat: number, lng: number }[] = [
    { lat: 51.044778, lng: -114.063139 },
    { lat: 48.860522, lng: 2.290764 },
    { lat: 40.704631, lng: -73.992393 },
    { lat: -33.859923, lng: 151.221337 },
    { lat: -22.951977, lng: -43.211229 },
    { lat: -33.916481, lng: 18.404595 },
    { lat: 27.179602, lng: 78.042071 },
    { lat: 29.975766, lng: 31.138347 },
    { lat: 51.500853, lng: -0.121669 },
    { lat: 47.369942, lng: 8.542655 },
    { lat: 49.453755, lng: 11.076768 },
    { lat: 45.433928, lng: 12.327064 },
    { lat: 25.195544, lng: 55.274498 },
    { lat: 35.476548, lng: 139.854666 },
    { lat: 51.177579, lng: -115.570720 }
];
// The maximum allowed itterations and attemps per itteration before the default location is returned, to prevent infinite loops
const MAX_ITTERATIONS = 25;
const ATTEMPTS_PER_ITTERATION = 10;
// regions where maps has little to no coverage
const DEAD_ZONES: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxlng: number;
}[] = [
        { minLat: 57, maxLat: 90, minLng: 70, maxlng: 180 }, // Syberia
        { minLat: 59.5, maxLat: 90, minLng: 36, maxlng: 180 }, // North Russia
        { minLat: 57, maxLat: 90, minLng: -180, maxlng: -25.5 }, // Geenland, Alaska & North Canada
        { minLat: -90, maxLat: -68.5, minLng: -180, maxlng: 180 }, // Antartica
        { minLat: 26.7, maxLat: 51.6, minLng: 50.4, maxlng: 123.5 }, // China & Middle East
        { minLat: 20.5, maxLat: 41, minLng: 92.5, maxlng: 118.4 }, // South China
        { minLat: 3, maxLat: 36.3, minLng: 37, maxlng: 78.4 }, // Middle East & India
        { minLat: 13, maxLat: 30.5, minLng: -12, maxlng: 29.5 }, // Sahara
        { minLat: -16.8, maxLat: 29.5, minLng: 7, maxlng: 33.5 }, // Central Africa
        { minLat: -12.8, maxLat: 11.8, minLng: -20.5, maxlng: -61.8 }, // Amazon
        { minLat: 12.2, maxLat: 24.6, minLng: -86, maxlng: -67.7 }, // Caribian & Central America
        { minLat: -32, maxLat: -11, minLng: -119.3, maxlng: -144.9 }, // Central Australia
        { minLat: -27.9, maxLat: -5, minLng: 33.5, maxlng: 52.7 }, // Madacascar
        { minLat: -11.9, maxLat: 11.9, minLng: 126.5, maxlng: 162.7 }, // Papua New Guinea
    ];

export default function gameRequestHandler(
    socket: socketio.Socket,
    io: socketio.Server,
    mongodbClient: MongoClient
) {
    async function getLatLong(
        rounds: number
    ): Promise<{ lat: number; lng: number }[]> {
        const gameLatLng: { lat: number; lng: number }[] = [];
        const promises = Array.from(Array(rounds)).map(async () =>
            gameLatLng.push(await randomizeLatLong())
        );
        await Promise.all(promises);
        return gameLatLng;
    }

    async function randomizeLatLong(): Promise<{ lat: number; lng: number }> {
        const randomCoordUrl = "https://api.3geonames.org/?randomland=yes&json=1";
        const coordinates: {
            lat: number;
            lng: number;
            valid: boolean;
        }[] = Array.from(Array(ATTEMPTS_PER_ITTERATION));
        let count = 0;
        try {
            do {
                if (count++ >= MAX_ITTERATIONS) return DEFAULT_LOC[Math.floor(Math.random() * DEFAULT_LOC.length)];
                const radomLocPromises = coordinates.map(
                    async (v, i) =>
                        (coordinates[i] = await locationValid(
                            (await axios.get(randomCoordUrl)).data
                        ))
                );
                await Promise.all(radomLocPromises);
            } while (coordinates.filter((v) => v.valid).length === 0);
        } catch (error) {
            console.log(error);
            return DEFAULT_LOC[Math.floor(Math.random() * DEFAULT_LOC.length)];
        }
        const coordinate = coordinates.filter((v) => v.valid)[0];
        return { lat: coordinate.lat, lng: coordinate.lng };
    }

    async function locationValid(
        data: any
    ): Promise<{ lat: number; lng: number; valid: boolean }> {
        const lat = Number(data.nearest.latt);
        const lng = Number(data.nearest.longt);
        let valid = false;
        const mapsMetadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${envConfig.server_maps_k}`;

        if (
            DEAD_ZONES.filter(
                (zone) =>
                    lat >= zone.minLat &&
                    lat <= zone.maxLat &&
                    lng >= zone.minLng &&
                    lng <= zone.maxlng
            ).length > 0
        )
            return { lat, lng, valid };

        const response = await axios.get(mapsMetadataUrl);
        const validationData = response.data;
        if (validationData.status === "OK") valid = true;
        return { lat, lng, valid };
    }

    async function terminateTheActiveGamesUsersAreIn() {
        const collection = mongodbClient
            .db(envConfig.db_default_db)
            .collection("games");
        const thatGame: GameObject = await collection.findOne({
            $or: [
                { gameStatus: GAME_STATUS_CREATED },
                { gameStatus: GAME_STATUS_STARTED },
            ],
            "users.socketID": socket.id,
            "users.checkedIn": true,
        });
        if (thatGame) {
            cancelGame(thatGame.gameID, "someone cancelled");
        }
    }

    function remove_user_from_queues() {
        QUEUE_LIST.forEach((queue) => {
            queue.forEach((value, i) => {
                if (value.socketID === socket.id) {
                    queue.splice(i, 1);
                }
            });
        });
    }

    async function handleDisconnectionLogic() {
        remove_user_from_queues();
        await terminateTheActiveGamesUsersAreIn();
        // const collection = mongodbClient.db(envConfig.db_default_db).collection("games");
        // await collection.updateOne({  }, {});
    }

    function sendNewInvitesToUser(username: string) {
        const collection = mongodbClient
            .db(envConfig.db_default_db)
            .collection("requests");
        const result = collection.findOne({ user: username });
        result.then((requestResult: RequestCollection) => {
            console.log("game--get-game-invites result", result);
            if (requestResult) {
                io.to(username).emit("game--get-game-invites-result", {
                    incGameRequest: requestResult.incGameRequests,
                });
            }
        });
    }

    async function cancelGame(gameID: string, reason?: string) {
        const collection = mongodbClient
            .db(envConfig.db_default_db)
            .collection("games");
        const theGame: GameObject = await collection.findOne({ gameID });
        const gameOldStatus = theGame.gameStatus;
        await collection.updateOne(
            { gameID },
            {
                $set: {
                    gameStatus: GAME_STATUS_CANCELLED,
                },
            }
        );
        if (theGame) {
            console.log("the game to be cancelled", theGame);
            const requestCollection = mongodbClient
                .db(envConfig.db_default_db)
                .collection("requests");
            for (const player of theGame.users) {
                await requestCollection.updateOne(
                    { user: player.username },
                    {
                        $pull: {
                            incGameRequests: {
                                gameID,
                            },
                        },
                    }
                );
                sendNewInvitesToUser(player.username);
            }

            if (gameOldStatus === GAME_STATUS_CREATED) {
                // when the game hadn't started yet (waiting for player, etc.)
                // tell everyone waiting for this game to stop waiting

                // get the latest game info to avoid race condition, once the game has already stopped, no one can check in anymore so it's safe here
                const theUpdatedGame: GameObject = await collection.findOne({
                    gameID,
                });
                for (const player of theUpdatedGame.users) {
                    if (player.checkedIn) {
                        io.to(player.username).emit("game--game-cancelled", { reason });
                    }
                }
            } else if (gameOldStatus === GAME_STATUS_STARTED) {
                // when the game had started, all requests for this game should already have been removed
                io.to(theGame.gameID).emit("game--game-cancelled", { reason });
            }
        }
    }

    async function createSinglePlayerGame(data: GameRequestCreate) {
        const collection = mongodbClient
            .db(envConfig.db_default_db)
            .collection("games");
        const gameID = data.username + "-" + Date.now();

        const gameLatLng = await getLatLong(data.numberOfRounds);

        const gameGuessedLatLng: any = {};
        for (const player of data.players) {
            gameGuessedLatLng[player.username] = {};
            for (let i = 0; i < data.numberOfRounds; i++) {
                gameGuessedLatLng[player.username]["round-" + i] = {
                    lat: undefined,
                    lng: undefined,
                };
            }
        }

        const score: any = {};
        score[data.username] = {};
        // oh god fix it if you feel like it's waste
        for (let i = 1; i < data.numberOfRounds + 1; i++) {
            score[data.username]["round-" + i] = MAX_ROUND_SCORE;
        }
        const userlist: { username: string; checkedIn: true }[] = [
            { username: data.username, checkedIn: true },
        ];
        // perform actions on the collection object
        await collection.updateOne(
            { gameID },
            {
                $setOnInsert: {
                    gameID,
                },
                $set: {
                    numberOfRound: data.numberOfRounds,
                    timeLimitPerRound: data.roundTimeLimit,
                    enableMovement: data.enableMovement,
                    latLngData: gameLatLng,
                    users: userlist,
                    currentRound: 1,
                    scores: score,
                    gameType: GAME_MODE_SINGLEPLAYER,
                    gameGuessedLatLng,
                },
            },
            {
                upsert: true,
            }
        );

        const theGame = await collection.findOne({ gameID });
        io.to(data.username).emit("game--created-sp-start", theGame);
    }

    async function createGameRequests(
        gameData: { gameID: string; gameMode: string },
        userlist: {
            username: string,
            checkedIn: boolean,
            socketID?: string
        }[],
        owner: string
    ) {
        const collection = mongodbClient
            .db(envConfig.db_default_db)
            .collection("requests");

        userlist.forEach((player) => {
            if (player.username !== owner) {
                collection
                    .updateOne(
                        { user: player.username },
                        {
                            $setOnInsert: {
                                incFriendRequests: [],
                                pendingFriendRequests: [],
                            },
                            $push: {
                                incGameRequests: gameData,
                            },
                        },
                        {
                            upsert: true,
                        }
                    )
                    .then((done) => {
                        sendNewInvitesToUser(player.username);
                    })
                    .catch((error) => {
                        console.log("error", error);
                    });
            }
        });
    }

    async function createCoOpGame(
        data: GameRequestCreate
    ): Promise<{ gameID: string; gameMode: string }> {
        const collection = mongodbClient
            .db(envConfig.db_default_db)
            .collection("games");
        const gameID = data.username + "-" + Date.now();

        // Competitive gets randomized lat-longs
        const gameLatLng = await getLatLong(NUM_ROUNDS_COOP);

        const gameGuessedLatLng: any = {};
        for (const player of data.players) {
            gameGuessedLatLng[player.username] = {};
            for (let i = 0; i < data.numberOfRounds; i++) {
                gameGuessedLatLng[player.username]["round-" + i] = {
                    lat: undefined,
                    lng: undefined,
                };
            }
        }

        // Init the scorelist for all players
        const score: any = {};
        for (const player of data.players) {
            score[player.username] = {};
            for (let i = 1; i < NUM_ROUNDS_COOP + 1; i++) {
                score[player.username]["round-" + i] = MAX_ROUND_SCORE;
            }
        }

        // perform actions on the collection object
        await collection.updateOne(
            { gameID },
            {
                $setOnInsert: {
                    gameID,
                },
                $set: {
                    numberOfRound: NUM_ROUNDS_COOP,
                    enableMovement: ENABLE_MOVEMENT_COOP,
                    timeLimitPerRound: ROUND_TIME_LIMIT_COOP,
                    latLngData: gameLatLng,
                    users: data.players,
                    currentRound: 1,
                    scores: score,
                    gameType: GAME_MODE_COOP,
                    gameStatus: GAME_STATUS_CREATED,
                    gameGuessedLatLng,
                },
            },
            {
                upsert: true,
            }
        );

        for (const player of data.players) {
            io.to(player.username).emit("game--created-public-mp-found", {
                gameID,
                totalCheckedIn: 1,
                totalCount: data.players.length,
            });
        }
        await checkPlayers(gameID);
        return { gameID, gameMode: GAME_MODE_COOP };
    }

    async function createCompetitiveGame(
        data: GameRequestCreate
    ): Promise<{ gameID: string; gameMode: string }> {
        const collection = mongodbClient
            .db(envConfig.db_default_db)
            .collection("games");

        const gameID = data.username + "-" + Date.now();
        // Competitive gets randomized lat-longs
        const gameLatLng = await getLatLong(NUM_ROUNDS_COMPETITIVE);

        const gameGuessedLatLng: any = {};
        for (const player of data.players) {
            gameGuessedLatLng[player.username] = {};
            for (let i = 0; i < data.numberOfRounds; i++) {
                gameGuessedLatLng[player.username]["round-" + i] = {
                    lat: undefined,
                    lng: undefined,
                };
            }
        }

        // Init the scorelist for all players
        const score: any = {};
        for (const player of data.players) {
            score[player.username] = {};
            for (let i = 1; i < NUM_ROUNDS_COMPETITIVE + 1; i++) {
                score[player.username]["round-" + i] = MAX_ROUND_SCORE;
            }
        }

        // perform actions on the collection object
        await collection.updateOne(
            { gameID },
            {
                $setOnInsert: {
                    gameID,
                },
                $set: {
                    numberOfRound: NUM_ROUNDS_COMPETITIVE,
                    enableMovement: ENABLE_MOVEMENT_COMPETITIVE,
                    timeLimitPerRound: ROUND_TIME_LIMIT_COMPETITIVE,
                    latLngData: gameLatLng,
                    users: data.players,
                    currentRound: 1,
                    scores: score,
                    gameType: GAME_MODE_COMPETITIVE,
                    gameStatus: GAME_STATUS_CREATED,
                    gameGuessedLatLng,
                },
            },
            {
                upsert: true,
            }
        );

        for (const player of data.players) {
            io.to(player.username).emit("game--created-public-mp-found", {
                gameID,
                totalCheckedIn: 1,
                totalCount: data.players.length,
            });
        }
        await checkPlayers(gameID);
        return { gameID, gameMode: GAME_MODE_COMPETITIVE };
    }

    async function createHideAndSeekGame(
        data: GameRequestCreate
    ): Promise<{ gameID: string; gameMode: string }> {
        const collection = mongodbClient
            .db(envConfig.db_default_db)
            .collection("games");
        const gameID = data.username + "-" + Date.now();

        // Hide and seek user-defined lat longs
        const gameLatLng: any = {};
        const gameGuessedLatLng: any = {};
        // Init the scorelist for all players
        const score: any = {};
        for (const player of data.players) {
            score[player.username] = {};
            for (let i = 1; i < NUM_ROUNDS_HIDENSEEK + 1; i++) {
                score[player.username]["round-" + i] = MAX_ROUND_SCORE;
            }

            gameLatLng[player.username] = {};
            for (let i = 1; i < NUM_ROUNDS_HIDENSEEK + 1; i++) {
                gameLatLng[player.username]["round-" + i] = {
                    lat: undefined,
                    lng: undefined,
                };
            }
            gameGuessedLatLng[player.username] = {};
            for (let i = 0; i < data.numberOfRounds; i++) {
                gameGuessedLatLng[player.username]["round-" + i] = {
                    lat: undefined,
                    lng: undefined,
                };
            }
        }

        // perform actions on the collection object
        await collection.updateOne(
            { gameID },
            {
                $setOnInsert: {
                    gameID,
                },
                $set: {
                    numberOfRound: NUM_ROUNDS_HIDENSEEK,
                    enableMovement: ENABLE_MOVEMENT_HIDENSEEK,
                    timeLimitPerRound: ROUND_TIME_LIMIT_HIDENSEEK,
                    latLngData: gameLatLng,
                    users: data.players,
                    currentRound: 1,
                    scores: score,
                    gameType: GAME_MODE_HIDENSEEK,
                    currentPhase: HIDENSEEK_ROUND_SETUP_PHASE,
                    gameStatus: GAME_STATUS_CREATED,
                    gameGuessedLatLng,
                },
            },
            {
                upsert: true,
            }
        );

        for (const player of data.players) {
            io.to(player.username).emit("game--created-public-mp-found", {
                gameID,
                totalCheckedIn: 1,
                totalCount: data.players.length,
            });
        }
        await checkPlayers(gameID).then();
        return { gameID, gameMode: GAME_MODE_HIDENSEEK };
    }

    async function checkPlayers(gameID: string): Promise<boolean> {
        const collection = mongodbClient
            .db(envConfig.db_default_db)
            .collection("games");
        const theGame: GameObject = await collection.findOne({ gameID });
        if (theGame) {
            console.log("found the game", theGame);
            let totalCheckedIn = 0;
            const users = theGame.users;
            const totalCount = users.length;
            users.forEach((user) => {
                if (user.checkedIn) {
                    totalCheckedIn++;
                }
            });
            if (totalCheckedIn === totalCount) {
                await collection.updateOne(
                    { gameID },
                    {
                        $set: {
                            gameStatus: GAME_STATUS_STARTED,
                        },
                    }
                );

                const requestCollection = mongodbClient
                    .db(envConfig.db_default_db)
                    .collection("requests");
                users.forEach((user) => {
                    requestCollection.updateOne(
                        { user: user.username },
                        {
                            $pull: {
                                incGameRequests: {
                                    gameID: theGame.gameID,
                                },
                            },
                        }
                    );
                    sendNewInvitesToUser(user.username);
                });

                users.forEach((player) => {
                    io.to(player.username).emit("game--created-public-mp-start", {
                        gameID,
                    });
                });
                return true;
            } else {
                users.forEach((player) => {
                    io.to(player.username).emit("game--created-public-mp-found", {
                        gameID,
                        totalCheckedIn,
                        totalCount,
                    });
                });
                return false;
            }
        } else {
            return false;
        }
    }

    socket.on("disconnect", async () => {
        handleDisconnectionLogic();
    });

    socket.on("game--cancel-queue", async (data: GameRequestCancel) => {
        remove_user_from_queues();
    });

    socket.on("game--submit-join", async (data: GameRequestJoin) => {
        console.log("game--submit-join:", data);
        if (data.gameType.toLowerCase() === GAME_MODE_JOIN) {
            console.log("Requesting to join a game:", data);

            // Fetch the game from the DB and check-in the user
            const collection = mongodbClient
                .db(envConfig.db_default_db)
                .collection("games");
            const currentGame: GameObject = await collection.findOne({
                gameID: data.gameID,
            });
            if (!currentGame) return;
            if (
                currentGame.gameStatus === GAME_STATUS_ENDED ||
                currentGame.gameStatus === GAME_STATUS_CANCELLED
            ) {
                io.to(data.username).emit("game--submit-join-invalid", {});
                return;
            }

            const updatedUsers = currentGame.users;
            for (const user of updatedUsers) {
                if (user.username === data.username) {
                    user.checkedIn = true;
                    user.socketID = socket.id;
                    break;
                }
            }

            // Update DB game information with checked in player
            await collection.updateOne(
                { gameID: data.gameID },
                {
                    $set: {
                        users: updatedUsers,
                    },
                }
            );

            // Add the user to the GameID socket room
            socket.join(data.gameID);
            const playersChecked = await checkPlayers(data.gameID);
            if (playersChecked) {
                // All players have checked in - start the game
                io.to(data.gameID).emit("game--created-private-mp-start", {
                    gameMode: currentGame.gameType,
                    gameID: data.gameID,
                });
            } else {
                // Missing players - wait for them to check in
                io.to(data.gameID).emit("game--created-private-mp-wait", {
                    gameMode: currentGame.gameType,
                    gameID: data.gameID,
                    userslist: updatedUsers,
                });
            }
        } else {
            console.log(
                "SERVER ERROR: Unhandled game type '" +
                data.gameType +
                "' in game--submit-join socket event"
            );
        }
    });

    socket.on("game--submit-play", async (data: GameRequestCreate) => {
        console.log("game--submit-play", data);
        socket.emit("game--currently-created", {});

        if (data.gameType.toLowerCase() === GAME_MODE_SINGLEPLAYER) {
            appStatus.ongoingGames += 1;
            createSinglePlayerGame(data);
        } else if (data.gameType.toLowerCase() === GAME_MODE_HIDENSEEK) {
            /* Private Game */
            if (data.players) {
                appStatus.ongoingGames += 1;
                const tempPlayers = data.players;
                tempPlayers.push({
                    username: data.username,
                    checkedIn: true,
                    socketID: socket.id,
                });
                const gameData: {
                    gameID: string;
                    gameMode: string;
                } = await createHideAndSeekGame(data);
                io.to(data.username).emit("game--created-private-mp-wait", {
                    gameID: gameData.gameID,
                    gameMode: gameData.gameMode,
                    userlist: tempPlayers,
                });
                socket.join(gameData.gameID);
                createGameRequests(gameData, tempPlayers, data.username);
            } else {
                /* Public Matchmaking TODO Make more DRY with Comp + Coop*/
                QUEUE_HIDEANDSEEK.push({
                    username: data.username,
                    socketID: socket.id,
                });
                if (QUEUE_HIDEANDSEEK.length >= NUM_PLAYERS_HIDENSEEK) {
                    console.log(
                        "Enough players joined - starting a public hide and seek game"
                    );
                    appStatus.ongoingGames += 1;

                    // Match players from Queue, FIFO
                    const playerlist: any[] = [];
                    for (let i = 0; i < NUM_PLAYERS_HIDENSEEK; i++) {
                        // TODO Sanity check: are all players online right now?
                        const player = QUEUE_HIDEANDSEEK.shift();
                        playerlist.push({
                            username: player.username,
                            checkedIn: true,
                            socketID: player.socketID,
                        });
                    }
                    data.players = playerlist;

                    // Create game instance and start the game
                    await createHideAndSeekGame(data);
                } else {
                    // Waiting on other users to join the matchmaking queue
                    io.to(data.username).emit("game--joined-queue-wait", {});
                }
            }
        } else if (data.gameType.toLowerCase() === GAME_MODE_COMPETITIVE) {
            // Private game if players were specified
            if (data.players) {
                appStatus.ongoingGames += 1;
                // TODO Create game and send wait event to initiating user
                const tempPlayers = data.players;
                tempPlayers.push({
                    username: data.username,
                    checkedIn: true,
                    socketID: socket.id,
                });
                const gameData: {
                    gameID: string;
                    gameMode: string;
                } = await createCompetitiveGame(data);
                io.to(data.username).emit("game--created-private-mp-wait", {
                    gameID: gameData.gameID,
                    gameMode: gameData.gameMode,
                    userlist: tempPlayers,
                });
                socket.join(gameData.gameID);
                createGameRequests(gameData, tempPlayers, data.username);
                // TODO Update DB with game invites
                // TODO send game invite event

                // Wait for all players to join
                // Return wait event
                // Other players will join by invite from join multiplayer tab
                // As they join:
                // Find DB game instance, and check-in players
                // When all players joined, emit game start event to socket room
            }

            // Public random matchmaking
            else {
                QUEUE_COMPETITIVE.push({
                    username: data.username,
                    socketID: socket.id,
                });
                if (QUEUE_COMPETITIVE.length >= NUM_PLAYERS_COMPETITIVE) {
                    console.log(
                        "Enough players joined - starting a public competitive game"
                    );
                    appStatus.ongoingGames += 1;

                    // Match players from Queue, FIFO
                    const playerlist: any[] = [];
                    for (let i = 0; i < NUM_PLAYERS_COMPETITIVE; i++) {
                        // TODO Sanity check: are all players online right now?
                        const player = QUEUE_COMPETITIVE.shift();
                        playerlist.push({
                            username: player.username,
                            checkedIn: true,
                            socketID: player.socketID,
                        });
                    }
                    data.players = playerlist;

                    // Create game instance and start the game

                    await createCompetitiveGame(data);
                } else {
                    // Waiting on other users to join the matchmaking queue
                    io.to(data.username).emit("game--joined-queue-wait", {});
                }
            }
        } else if (data.gameType.toLowerCase() === GAME_MODE_COOP) {
            // Private game if players were specified
            if (data.players) {
                appStatus.ongoingGames += 1;
                // TODO Create game and send wait event to initiating user
                const tempPlayers = data.players;
                tempPlayers.push({
                    username: data.username,
                    checkedIn: true,
                    socketID: socket.id,
                });
                const gameData: {
                    gameID: string;
                    gameMode: string;
                } = await createCoOpGame(data);
                io.to(data.username).emit("game--created-private-mp-wait", {
                    gameID: gameData.gameID,
                    gameMode: gameData.gameMode,
                    userlist: tempPlayers,
                });
                socket.join(gameData.gameID);
                createGameRequests(gameData, tempPlayers, data.username);

                // TODO Update DB with game invites
                // TODO send game invite event

                // Wait for all players to join
                // Return wait event
                // Other players will join by invite from join multiplayer tab
                // As they join:
                // Find DB game instance, and check-in players
                // When all players joined, emit game start event to socket room
            }

            // Public random matchmaking
            else {
                QUEUE_COOP.push({ username: data.username, socketID: socket.id });
                if (QUEUE_COOP.length >= NUM_PLAYERS_COOP) {
                    console.log(
                        "Enough players joined - starting a public competitive game"
                    );
                    appStatus.ongoingGames += 1;

                    const playerlist: any[] = [];
                    for (let i = 0; i < NUM_PLAYERS_COOP; i++) {
                        // TODO Sanity check: are all players online right now?
                        const player = QUEUE_COOP.shift();
                        playerlist.push({
                            username: player.username,
                            checkedIn: true,
                            socketID: player.socketID,
                        });
                    }
                    data.players = playerlist;

                    // Create game instance and start the game
                    createCoOpGame(data);
                } else {
                    // Waiting on other users to join the matchmaking queue
                    io.to(data.username).emit("game--joined-queue-wait", {});
                }
            }
        } else {
            console.log("UNHANDLED GAME TYPE!!", data);
        }
    });

    socket.on("game--get-friends", async (data: SocketAuthUserLoggedInOut) => {
        console.log("game--get-friends", data);
        const collection = mongodbClient
            .db(envConfig.db_default_db)
            .collection("users");
        const result: UserCollection = await collection.findOne({
            user: data.username,
        });
        console.log("game--get-friends result", result);
        if (result) {
            io.to(data.username).emit("game--get-friends-result", result.friends);
        }
    });

    socket.on(
        "game--get-game-invites",
        async (data: SocketAuthUserLoggedInOut) => {
            console.log("game--get-game-invites", data);
            sendNewInvitesToUser(data.username);
        }
    );

    socket.on("game--cancel-game", async (data: GetGameData) => {
        console.log("game--cancel-game data", data);
        if (data.gameID) {
            cancelGame(data.gameID);
        }
    });
}
