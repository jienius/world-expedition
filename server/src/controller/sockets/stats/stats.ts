import socketio from 'socket.io';
import { MongoClient } from 'mongodb';
import envConfig from './../../../environments/environment';
import { GameObject, GAME_MODE_COMPETITIVE, GAME_MODE_COOP, GAME_MODE_HIDENSEEK, GAME_MODE_SINGLEPLAYER, GAME_STATUS_CANCELLED, GAME_STATUS_ENDED, HIDENSEEK_ROUND_PLAY_PHASE, HIDENSEEK_ROUND_SETUP_PHASE, MAX_ROUND_SCORE } from './../../../models/games/globals';




export default function chatHandler(socket: socketio.Socket, io: socketio.Server, mongoClient: MongoClient) {

    socket.on('stats--get-stats', async (username: string) => {
        console.log("stats--get-stats", username);


        let favGame = "N/A";
        let numCheck = 0;
        const gamesCollection = mongoClient.db(envConfig.db_default_db).collection("games");
        const numOfGames: any = await gamesCollection.find({
            "users.username": username
        }).count();
        const numOfSPGames: any = await gamesCollection.find({
            "users.username": username,
            "gameType": GAME_MODE_SINGLEPLAYER
        }).count();
        if (numOfSPGames > numCheck) {
            numCheck = numOfSPGames;
            favGame = "Single Player"
        }
        const numOfCompGames: any = await gamesCollection.find({
            "users.username": username,
            "gameType": GAME_MODE_COMPETITIVE
        }).count();
        if (numOfCompGames > numCheck) {
            numCheck = numOfCompGames;
            favGame = "Competitive"
        }
        const numOfCoOpGames: any = await gamesCollection.find({
            "users.username": username,
            "gameType": GAME_MODE_COOP
        }).count();
        if (numOfCoOpGames > numCheck) {
            numCheck = numOfCoOpGames;
            favGame = "Co-operative"
        }
        const numOfHideNSeekGames: any = await gamesCollection.find({
            "users.username": username,
            "gameType": GAME_MODE_HIDENSEEK
        }).count();
        if (numOfHideNSeekGames > numCheck) {
            numCheck = numOfHideNSeekGames;
            favGame = "Hide 'N Seek"
        }
        const numOfCancelledGames: any = await gamesCollection.find({
            "users.username": username,
            "gameStatus": GAME_STATUS_CANCELLED
        }).count();

        const returnMessage = {
            numOfGames1: numOfGames,
            numOfSPGames1: numOfSPGames,
            numOfCompGames1: numOfCompGames,
            numOfCoOpGames1: numOfCoOpGames,
            numOfHideNSeekGames1: numOfHideNSeekGames,
            numOfCancelledGames1: numOfCancelledGames,
            favouriteMode1: favGame,
        }
        io.to(username).emit('stats--return-info', returnMessage);




    });

};