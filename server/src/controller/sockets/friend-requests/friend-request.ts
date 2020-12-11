import socketio from 'socket.io';
import { MongoClient } from 'mongodb';
import { GenericSocketIncMessage, SocketAuthUserLoggedInOut, SocketIncCommand, SocketIncMessageLogin, SocketIncNewMsg, SocketIncRegistration, SocketIncUpdateUserData, SocketIncValidateToken, FriendRequestMessage } from '../../../models/socket-in-message';
import envConfig from './../../../environments/environment';



export default function friendRequestHandler(socket: socketio.Socket, io: socketio.Server, mongoClient: MongoClient) {

    socket.on('friend--user-find-friend', async (data: FriendRequestMessage) => {
        findAndReturnSearch(data.searchname);

    });

    socket.on('friend--user-get-all-requests', async (data: FriendRequestMessage) => {
        console.log("data", data)
        getRequests(data.username);
    });

    socket.on('friend--user-send-friend-request', async (data: FriendRequestMessage) => {
        console.log('friend--user-send-friend-request', data);
        sendFriendRequest(data);
    });

    socket.on('friend--user-get-friend', async (data: FriendRequestMessage) => {
        console.log('friend--user-get-friend', data);
        getFriends(data.username);
    });

    socket.on('friend--user-accept-friend-request', async (data: FriendRequestMessage) => {
        console.log('friend--user-accept-friend-request', data);
        acceptFriendRequest(data);
    });

    socket.on('friend--user-reject-friend-request', async (data: FriendRequestMessage) => {
        console.log('friend--user-reject-friend-request', data);
        rejectFriendRequest(data);
    });

    socket.on('friend--user-remove-friend', async (data: FriendRequestMessage) => {
        console.log('friend--user-remove-friend', data);
        removeFriend(data);
        // socket.leave(data.username);
        // socket.emit('auth--login-result', { result: 'received', data });

    });



    async function getFriends(user: string) {

        const collection = mongoClient.db(envConfig.db_default_db).collection("users");
        const searchResults: any = await collection.findOne({ 'user': user });
        if (searchResults) {
            console.log(searchResults);
            io.to(user).emit('friend--get-friend-response', searchResults.friends);
        }
        else {
            console.log("Err friend--get-friend-response");
        }


    }

    async function findAndReturnSearch(searchname: string) {

        const collection = mongoClient.db(envConfig.db_default_db).collection("users");
        const searchResults: any = await collection.findOne({ 'user': searchname });
        if (searchResults) {
            console.log(searchResults);
            socket.emit('friend--search-friend-response', searchResults);
        }
        else {
            console.log("Err friend--user-find-friend");
            socket.emit('friend--search-friend-response', null);
        }
    }

    async function sendFriendRequest(data: FriendRequestMessage) {

        if (await fatedFriends(data)) {
            acceptFriendRequest(data);
        }
        else {
            const collection = mongoClient.db(envConfig.db_default_db).collection("requests");
            const time = Date.now();
            const incRequest = {
                from: data.username,
                date: time
            };

            const pendRequest = {
                to: data.searchname,
                date: time
            };
            collection.updateOne(
                { 'user': data.searchname },
                {
                    '$setOnInsert': {
                        'incGameRequests': [],
                        'pendingFriendRequests': []
                    },
                    '$push': {
                        'incFriendRequests': incRequest,

                    }
                }
                ,
                {
                    'upsert': true
                }
            ).then(done => {
                getRequests(data.searchname);

            }).catch(error => {
                console.log("friend--user-send-friend-request error:", error);
            });

            collection.updateOne(
                { 'user': data.username },
                {
                    '$setOnInsert': {
                        'incFriendRequests': [],
                        'incGameRequests': []
                    },
                    '$push': {
                        'pendingFriendRequests': pendRequest
                    }
                }
                ,
                {
                    'upsert': true
                }
            ).then(done => {
                getRequests(data.username);

            }).catch(error => {
                console.log("friend--user-send-friend-request error:", error);
            });
        }
    }

    async function getRequests(username: string) {
        console.log(username);
        const collection = mongoClient.db(envConfig.db_default_db).collection("requests");
        const result = await collection.findOne({ 'user': username });
        if (result) {
            console.log('friend--user-get-requests result', result);
            io.to(username).emit('friend--user-get-requests-response', { incFriendRequests: result.incFriendRequests, pendingFriendRequests: result.pendingFriendRequests });
        }
        else {
            console.log('friend--user-get-requests err', result);
        }


    }

    async function acceptFriendRequest(data: FriendRequestMessage) {
        const collection = mongoClient.db(envConfig.db_default_db).collection("users");
        collection.updateOne(
            { 'user': data.searchname },
            {
                '$push': {
                    'friends': data.username,

                }
            },
            {
                'upsert': true
            }
        ).then(done => {
            getFriends(data.searchname);

        }).catch(error => {
            console.log("auth--user-send-friend-request accept error:", error);
        });

        collection.updateOne(
            { 'user': data.username },
            {
                '$push': {
                    'friends': data.searchname
                }
            },
            {
                'upsert': true
            }
        ).then(done => {
            getFriends(data.username);
        }).catch(error => {
            console.log("auth--user-send-friend-request accept error:", error);
        });

        const requestCollection = mongoClient.db(envConfig.db_default_db).collection("requests");
        requestCollection.updateOne(
            { 'user': data.searchname },
            {
                '$pull': {
                    'pendingFriendRequests': { to: data.username },
                }
            }
            ,
            {
                'upsert': true
            }
        ).then(done => {
            getRequests(data.searchname);

        }).catch(error => {
            console.log("friend--user-send-friend-request accept req error:", error);
        });

        requestCollection.updateOne(
            { 'user': data.username },
            {
                '$pull': {
                    'incFriendRequests': { from: data.searchname }
                }
            }
            ,
            {
                'upsert': true
            }
        ).then(done => {
            getRequests(data.username);

        }).catch(error => {
            console.log("friend--user-send-friend-request req error:", error);
        });


    }

    function rejectFriendRequest(data: FriendRequestMessage) {
        const requestCollection = mongoClient.db(envConfig.db_default_db).collection("requests");
        requestCollection.updateOne(
            { 'user': data.searchname },
            {
                '$pull': {
                    'pendingFriendRequests': { to: data.username },
                }
            }
            ,
            {
                'upsert': true
            }
        ).then(done => {
            getRequests(data.searchname);

        }).catch(error => {
            console.log("friend--user-reject-friend-request error:", error);
        });

        requestCollection.updateOne(
            { 'user': data.username },
            {
                '$pull': {
                    'incFriendRequests': { from: data.searchname }
                }
            }
            ,
            {
                'upsert': true
            }
        ).then(done => {
            getRequests(data.username);

        }).catch(error => {
            console.log("friend--user-reject-request error:", error);
        });
    }

    async function removeFriend(data: FriendRequestMessage) {
        const collection = mongoClient.db(envConfig.db_default_db).collection("users");
        collection.updateOne(
            { 'user': data.searchname },
            {
                '$pull': {
                    'friends': data.username,
                }
            },
            {
                'upsert': true
            }
        ).then(done => {
            getFriends(data.searchname);

        }).catch(error => {
            console.log("friend--user-remove-friend error:", error);
        });

        collection.updateOne(
            { 'user': data.username },
            {
                '$pull': {
                    'friends': data.searchname
                }
            },
            {
                'upsert': true
            }
        ).then(done => {
            getFriends(data.username);

        }).catch(error => {
            console.log("friend--user-remove-friend error:", error);
        });

    }

    async function fatedFriends(data: FriendRequestMessage) {
        console.log("Fated Friends");
        const collection = mongoClient.db(envConfig.db_default_db).collection("requests");

        const searchResults: any = await collection.findOne({ 'user': data.searchname });

        let returnVal = false;
        searchResults.pendingFriendRequests.forEach((element: any) => {
            console.log("here", element.to, data.username)
            if (element.to === data.username) {
                returnVal = true;
            }
        });

        return returnVal;
    }



};