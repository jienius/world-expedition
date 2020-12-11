import socketio from 'socket.io';
import { SocketIncMessageLogin } from '../../../models/socket-in-message';
import { AuthenticationSystem } from './../../../businessLogic/authentication/auth';

export default function globalEventHandler(socket: socketio.Socket, authInstance: AuthenticationSystem, io: socketio.Server) {

    socket.on('global--initialization', (data: SocketIncMessageLogin) => {
        socket.emit('global--initialization-result', { result: 'received', data });
    });

};