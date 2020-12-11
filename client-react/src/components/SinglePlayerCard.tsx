import React, { useState, useEffect } from 'react';
import { Button, Row, Form, Card, Container } from 'react-bootstrap';
import './PlayCard.css';
import RangeSlider from 'react-bootstrap-range-slider';
import singleplayerPic from './../assets/single.svg';
import BootstrapSwitchButton from 'bootstrap-switch-button-react'

export default function SinglePlayerCard(props: { playCallback: (data: { roundTimeLimit: number,  numberOfRounds: number, enableMovement: boolean } ) => void }): JSX.Element {

    const [roundTimeLimit, setRoundTimeLimit] = useState(0);
    const [numberOfRounds, setNumberOfRounds] = useState(1);
    const [movementEnabled, setMovementEnabled] = useState(true);

    useEffect(() => {

    });

    
    function movementToggle() {
        let movement_enabled = $("#movement-toggle").prop("checked");
        setMovementEnabled(movement_enabled);
    }

    function play() {
        const data: { roundTimeLimit: number,  numberOfRounds: number, enableMovement: boolean } = {
            roundTimeLimit: roundTimeLimit,
            numberOfRounds: numberOfRounds,
            enableMovement: movementEnabled
        }
        props.playCallback(data)
    }

    return (
        <Card className="play-card-mode align-items-center shadow my-3">
            <Card.Header className="w-100 d-flex align-items-center justify-content-center text-center play-card-header Single">
                {/* <Card.Img variant="top" className="play-card-mode-image w-50" src={singleplayerPic} /> */}
                <img src={singleplayerPic} alt="singleplayerPic" className="play-card-mode-image img-fluid"></img>
            </Card.Header>
            <Card.Body className="w-100 play-mode-card-body-height d-sm-contents d-xs-contents">                
                <Card.Title className="text-center">Single Player</Card.Title>
                <Container>
                    <Row className="justify-content-center">
                        <Form.Label className="h5">Round Time Limit</Form.Label>
                    </Row>
                    <Row className="justify-content-center">
                        <RangeSlider
                                value={roundTimeLimit}
                                onChange={(e) => {
                                setRoundTimeLimit(parseInt(e.target.value));
                                }}
                                min={0} // 0 =: No time limit per round
                                max={20} // Max 10 min time limit per round
                                tooltip='off'
                        />
                    </Row>
                    <Row className="justify-content-center">
                        <Form.Label className="h5" >{roundTimeLimit > 0 ? roundTimeLimit + " Minutes" : "No Time Limit"} </Form.Label>
                    </Row>
                    <Row className="justify-content-center bg-colour">
                        <Form>
                            <Form.Label className="h5">Number of Rounds:</Form.Label>
                            <Row className="justify-content-center">
                                <Form.Group>
                                <RangeSlider
                                    value={numberOfRounds}
                                    onChange={(e) => {
                                    setNumberOfRounds(parseInt(e.target.value));
                                    }}
                                    min={1}
                                    max={10}
                                    tooltip='off'
                                />
                                </Form.Group>
                            </Row>
                            <Row className="justify-content-center">
                                <Form.Label className="h5" >{numberOfRounds === 1 ? numberOfRounds + " Round" : numberOfRounds + " Rounds"} </Form.Label>
                            </Row>
                        </Form>
                    </Row>
                    <Row className="justify-content-center">
                        <Form.Label className="h5">Enable Movement?</Form.Label>
                    </Row> 
                    <Row className="justify-content-center">
                        <BootstrapSwitchButton 
                            onlabel='On' 
                            offlabel='Off' 
                            checked={movementEnabled} 
                            onstyle='success'
                            offstyle='danger'
                            style='w-100'
                            onChange={(checked: boolean) => {
                                setMovementEnabled(checked)
                            }}/>
                    </Row>     
                    {/* <Row className="justify-content-center">
                        <Form.Label className="h4" >{movementEnabled ? 'I like to move' : "Help I'm disabled"} </Form.Label>
                    </Row> */}
                </Container>
            </Card.Body>
            <Card.Footer className="w-100 text-center">
                <Button id="game-init-singleplayer-play-btn" onClick={(event) => { play() }}>PLAY</Button>                       
            </Card.Footer>
        </Card>
    );
};