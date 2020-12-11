import React, { useState, useEffect } from 'react';
import { Button, Row, Form, Card, Container } from 'react-bootstrap';
import './PlayCard.css';
import RangeSlider from 'react-bootstrap-range-slider';
import multiplayerPic from './../assets/join.svg';
import BootstrapSwitchButton from 'bootstrap-switch-button-react'
import { socket } from '../controller/socket';

export default function MultiplayerJoinCard(props: { gameInvites: JSX.Element[], joinCallBack: (data: { gameID: string }) => void }): JSX.Element {

    const [gameID, setGameID] = useState('');

    function joinGame() {
        const data = {
            gameID
        }
        props.joinCallBack(data);
    }

    return (
        <Card className="play-card-mode align-items-center shadow my-3">
            <Card.Header className="w-100 d-flex align-items-center justify-content-center text-center play-card-header Join">
                {/* <Card.Img variant="top" className="play-card-mode-image img-fluid" src={multiplayerPic} /> */}
                <img src={multiplayerPic} alt="multiplayerJoinPic" className="play-card-mode-image img-fluid"></img>
            </Card.Header>
            <Card.Body className="w-100 play-mode-card-body-height d-sm-contents d-xs-contents">
                <Card.Title className="text-center">Join Through Game Invitations</Card.Title>
                <Container>
                    <Row className="justify-content-center">
                        <Form.Label>Select an invitation to join</Form.Label>
                    </Row>
                    <Row className="justify-content-center">
                        <Form.Group controlId="multiplayer-join-invites" className="w-100" >
                            <Form.Control as="select" onChange={((event) => {
                                // console.log("Select", event.target.value);
                                setGameID(event.target.value || '')
                            })}>
                                <option value="" key='game-option-key-default'>SELECT A GAME INVITE</option>
                                {props.gameInvites}
                            </Form.Control>
                        </Form.Group>
                    </Row>
                </Container>
            </Card.Body>
            <Card.Footer className="w-100 text-center">
                <Button id="game-init-singleplayer-play-btn" disabled={gameID ? false : true} onClick={(event) => { joinGame() }}>JOIN</Button>
            </Card.Footer>
        </Card>
    );
};