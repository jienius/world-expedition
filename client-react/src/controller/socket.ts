import socketIOClient from 'socket.io-client';
import cookiesService from './cookie-service';

// let socket: SocketIOClient.Socket = socketIOClient('http://93cdee5f9fbd.ngrok.io');
let socket: SocketIOClient.Socket = socketIOClient('http://localhost:8080');
// let accessToken = cookiesService.get('sampleSomething');

socket.emit('global--initialization', {});

export { socket };
