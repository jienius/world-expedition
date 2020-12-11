import React, { useState, useEffect } from 'react';
import $ from 'jquery'
import { InputGroup, FormControl, Button } from 'react-bootstrap';
import { socket } from '../controller/socket';
import './ChatBox.css';
import { GAME_MODE_SINGLEPLAYER } from '../lib/interface/game';

const ChatBox = (props: { gameID: string, username: string, gameType: string }): JSX.Element => {

    const [chatHistory, setChatHistory] = React.useState("Chat has started.");
    const [message, setMessage] = React.useState("");

    useEffect(() => {
        if (props.gameType === GAME_MODE_SINGLEPLAYER) {
            setChatHistory('Chat started! You have to supply both sides of the conversation though');
        }
        else {
            setChatHistory('Chat has started. Everyone play nice now!');
        }
    }, [props.gameID]);

    useEffect(() => {
        socket.on('chat--chat-response', (data: any) => {
            // console.log(data);
            setChatHistory(data.message);
        });
    }, []);

    useEffect(() => {
        let textArea = document.getElementById('chatArea') ? document.getElementById('chatArea') : document.getElementById('chatArea');
        if (textArea !== null) {
            textArea.scrollTop = textArea.scrollHeight;
        }
    }, [chatHistory])

    function sendMessage() {
        const newMessage = chatHistory + "\n" + props.username + " : " + message;
        socket.emit('chat--new-chat-message', { username: props.username, gameID: props.gameID, chatHistory: newMessage });

        let textArea = document.getElementById('chatArea') ? document.getElementById('chatArea') : document.getElementById('chatArea');
        setMessage("");
    }


    return (
        <>
            <InputGroup>
                <FormControl as="textarea" className="overflow-auto chatArea" id="chatArea" value={chatHistory} readOnly disabled={false} />
            </InputGroup>
            <InputGroup className="mb-3">
                <FormControl

                    placeholder="Say Something!"
                    value={message}
                    onChange={(event) => {
                        setMessage(event.target.value)
                    }}
                    onKeyUp={(event: React.KeyboardEvent<HTMLInputElement>) => { if (event.keyCode === 13) sendMessage() }}
                    onSubmit={sendMessage}
                />
                <Button type='submit' onClick={sendMessage}>Send</Button>
            </InputGroup>
        </>
    );
};

export default ChatBox;