import socketio from 'socket.io';
import { ChatMessage } from '../../../models/socket-in-message';
export default function chatHandler(socket: socketio.Socket, io: socketio.Server) {

    socket.on('chat--new-chat-message', async (data: ChatMessage) => {
        console.log("chat--new-chat-message", data);
        io.to(data.gameID).emit('chat--chat-response', { message: data.chatHistory })
    });

};