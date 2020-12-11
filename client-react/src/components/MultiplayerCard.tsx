import React, { useState, useEffect } from 'react';
import { Button, Row, Form, Card, Container, Col, OverlayTrigger, Popover } from 'react-bootstrap';
import './PlayCard.css';
import RangeSlider from 'react-bootstrap-range-slider';
import multiplayerDefaultPic from './../assets/join.svg';
import multiplayerCoopPic from './../assets/coop.svg';
import multiplayerCompPic from './../assets/comp.svg';
import multiplayerHidePic from './../assets/hide.svg';

import BootstrapSwitchButton from 'bootstrap-switch-button-react'
import { socket } from '../controller/socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'

export default function MultiplayerCard(props: { friendOptions: JSX.Element[], createCallback: (data: { gameMode: string, friends: string[] }) => void }): JSX.Element {

    const [gameMode, setGameMode] = useState('');
    const [friends, setFriends] = useState<string[]>([]);
    const [hasFriends, setHasFriends] = useState<boolean>(false);
    const [multiplayerPic, setMultiplayerPic] = useState(multiplayerDefaultPic);
    const [multiplayerPicClass, setMultiplayerPicClass] = useState('Default');
    const [popOver, setPopOver] = useState<{ popOverTitle: string, popOverContent: string }>(
        {
            popOverTitle: "Select a Mode",
            popOverContent: "Use the dropdown menu to select a mode"
        }
    );

    useEffect(() => {

    }, [props]);


    function onSelectChangeFriend(event: any) {
        if (event) {
            const selectedFriendsTemp: string[] = []
            Array.from(event.target.selectedOptions).forEach((value: any) => {
                selectedFriendsTemp.push(value.value)
            }
            )

            // console.log('selectedFriends', selectedFriendsTemp);
            setFriends(selectedFriendsTemp);
        }
    }

    function createGame() {
        const data: {
            gameMode: string,
            friends: string[]
        } = {
            friends,
            gameMode
        }
        data.friends.forEach((friend, index, arr) => {
            if (!friend) {
                arr.splice(index, 1);
            }
        });
        // console.log('multiplayer card', data);
        props.createCallback(data);
    }

    const popover = (
        <Popover id="popover-basic">
            <Popover.Title as="h3">{popOver.popOverTitle}</Popover.Title>
            <Popover.Content>
                {popOver.popOverContent}
            </Popover.Content>
        </Popover>
    );

    return (
        <Card className="play-card-mode align-items-center shadow my-3">
            <Card.Header className={"w-100 d-flex align-items-center justify-content-center text-center play-card-header " + multiplayerPicClass}>
                {/* <Card.Img variant="top" className="play-card-mode-image w-50" src={multiplayerPic} /> */}
                <img src={multiplayerPic} alt="multiplayerPic" className={"play-card-mode-image img-fluid"}></img>
            </Card.Header>
            <Card.Body className="w-100 play-mode-card-body-height d-sm-contents">
                <Card.Title className="text-center">Create A Multiplayer Game</Card.Title>
                <Container>
                    <Row className="justify-content-center">
                        <Form.Label>Select a game mode to play {gameMode}</Form.Label>
                        <Col xs={10}>
                            <Row className="justify-content-center">
                                <Form.Control as="select" onChange={((event) => {
                                    // console.log("Selected game mode: ", event.target.value);
                                    switch (event.target.value || '') {
                                        case 'Hide-n-Seek':
                                            setMultiplayerPic(multiplayerHidePic);
                                            setMultiplayerPicClass('Hide');
                                            setPopOver({ popOverTitle: 'Hide-n-Seek', popOverContent: 'In this game mode, you and your opponent get to place each other somewhere in the world! Whoever\'s guess is closest to their location gets more points!' })
                                            break;
                                        case 'Competitive':
                                            setMultiplayerPic(multiplayerCompPic);
                                            setMultiplayerPicClass('Comp');
                                            setPopOver({ popOverTitle: 'Competitive', popOverContent: 'Test your skills against others! Who ever guesses the closest to the randomly generated locations will be crowned the winner!' })
                                            break;
                                        case 'Co-Op':
                                            setMultiplayerPic(multiplayerCoopPic);
                                            setMultiplayerPicClass('Coop');
                                            setPopOver({ popOverTitle: 'Co-op', popOverContent: 'Work together to guess the location in the world! The score is a tally of the best of every player. FRIENDSHIP POWER' })
                                            break;
                                        default:
                                            setMultiplayerPic(multiplayerDefaultPic);
                                            setMultiplayerPicClass('Default')
                                            setPopOver({ popOverTitle: "Select a Mode", popOverContent: "Use the dropdown menu to select a mode" })
                                            break;
                                    }
                                    setGameMode(event.target.value || '');
                                    setHasFriends(false);
                                    setFriends([]);
                                })}>
                                    <option value="" key="select-a-game-mode-0">
                                        Select a game mode
                                        </option>
                                    <option value="Hide-n-Seek" key="select-a-game-mode-1">
                                        Hide-n-Seek
                                        </option>
                                    <option value="Competitive" key="select-a-game-mode-2">
                                        Competitive
                                        </option>
                                    <option value="Co-Op" key="select-a-game-mode-3">
                                        Co-Op
                                        </option>
                                </Form.Control>
                            </Row>
                        </Col>
                        <Col xs={2}>
                            <OverlayTrigger trigger="click" placement="top" overlay={popover}>
                                <Button className={multiplayerPicClass}>
                                    <FontAwesomeIcon icon={faInfoCircle} />
                                </Button>
                            </OverlayTrigger>
                        </Col>

                    </Row>

                    <Row className="justify-content-center">
                        <Form.Label className="text-center">
                            How would you like to start?
                        </Form.Label>
                    </Row>
                    <Row>
                        <BootstrapSwitchButton
                            onlabel='Invite friends'
                            offlabel='Join public match'
                            checked={hasFriends}
                            onstyle='primary'
                            offstyle='secondary'
                            style='w-100'
                            onChange={(checked: boolean) => {
                                setHasFriends(checked)
                                if (!checked) {
                                    setFriends([]);
                                }
                            }} />
                    </Row>
                    {
                        hasFriends ?
                            (
                                <>
                                    <Row className="justify-content-center">
                                        <Form.Group controlId="exampleForm.ControlSelect2">
                                            <Form.Label>{gameMode === 'Hide-n-Seek' ? 'Select a friend to play with them' : 'Select a friend or Ctrl+Click multiple'} </Form.Label>
                                        </Form.Group>
                                    </Row>
                                    <Row className="justify-content-center">
                                        <Form.Control as="select" className="w-100" multiple={gameMode !== 'Hide-n-Seek'} onChange={((event,) => { onSelectChangeFriend(event) })}>
                                            {gameMode === 'Hide-n-Seek' ? <option value="" key="Hide-n-seek-default">Select A Friend</option> : <> </>}
                                            {props.friendOptions}
                                        </Form.Control>
                                    </Row>
                                </>
                            ) : <></>
                    }
                    <Row className="justify-content-center">

                    </Row>
                </Container>
            </Card.Body>
            <Card.Footer className="w-100 text-center">
                <Button id="game-init-singleplayer-play-btn" disabled={gameMode ? false : true} onClick={(event) => { createGame() }}>CREATE</Button>
            </Card.Footer>
        </Card>
    );
};