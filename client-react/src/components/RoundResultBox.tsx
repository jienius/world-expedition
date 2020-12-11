import React, { useEffect, useState } from 'react';
import { Button, Carousel, Col, Container, Modal, OverlayTrigger, Popover, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { GameObject, GAME_MODE_HIDENSEEK, GAME_MODE_COOP, MAX_ROUND_SCORE } from '../lib/interface/game';
import './RoundResultBox.css';
import PlayerScoreBox from './PlayerScoreBox';
import PlayerGuessResultMap from './PlayerGuessResult';
import MapsAPIURL from '../controller/googleMapAPIScript';
export default function RoundResultBox(props: { theGame: GameObject, show: boolean, callback: () => void, username: string }): JSX.Element {

    const NUMBER_OF_TOP_USER = 3;

    const [showModal, setShowModal] = useState(false);

    const [topUsers, setTopUsers] = useState<JSX.Element[]>([]);
    const [scoreResults, setScoreResults] = useState<JSX.Element[]>([]);

    const [actualVSGuessedLatLng, setActualVSGuessedLatLng] = useState<{
        guessedLatLng: { lat: number, lng: number },
        actualLatLng: { lat: number, lng: number },
        username: string
    }[]>([]);

    const [displayGuessedMapModal, setDisplayGuessedMapModal] = useState(false);

    useEffect(() => {
        setShowModal(props.show);
    }, [props.show]);

    function closeResultLogic() {
        setShowModal(false);
        props.callback();
    }

    useEffect(() => {
        if (!props.theGame || !props.username) return;
        if (!props.theGame.users) return;
        if (!props.theGame.scores) return;
        if (!props.theGame.gameGuessedLatLng || Object.keys(props.theGame.gameGuessedLatLng).length === 0 || !props.theGame.gameGuessedLatLng[props.username]) return;

        setScoreResults(getListOfCarosels());
    }, [props.theGame, props.username]);

    function getListOfCarosels(): JSX.Element[] {
        let retVal: JSX.Element[] = [];
        retVal.push(
            getListOfScores(props.theGame.currentRound -1)
        )
        return retVal;
    }


    function getListOfScores(round: number): JSX.Element {
        let returnVal: JSX.Element[] = [];
        if (!props.username) return <div></div>;

        const rawPlayerScore: { username: string, score: number }[] = [];

        for (const user of props.theGame.users) {
            let userScore = props.theGame.scores[user.username]['round-' + round];
            rawPlayerScore.push(
                {
                    username: user.username,
                    score: userScore
                }
            );
        };

        const rankedScores = rankTheScore(rawPlayerScore);

        for (const rankedScore of rankedScores) {
            let actualLatLng: any = {}
            let guessedLatLng: any = {}
            if (props.theGame.gameType === GAME_MODE_HIDENSEEK) {
                const latLngData: any = props.theGame.latLngData
                actualLatLng = latLngData[rankedScore.username]['round-' + round];
                console.log('GameResultBox actualLatLng', actualLatLng);
                console.log('GameResultBox latLngData', latLngData);
            } else {
                actualLatLng = props.theGame.latLngData[round - 1];
                console.log('GameResultBox else actualLatLng', actualLatLng);
            }


            const guessedLatLngData: any = props.theGame.gameGuessedLatLng;
            guessedLatLng = guessedLatLngData[rankedScore.username]['round-' + round];

            const individualActualVSGuessedLatLngPair: {
                guessedLatLng: { lat: number, lng: number },
                actualLatLng: { lat: number, lng: number },
                username: string
            }[] = [];
            individualActualVSGuessedLatLngPair.push({
                guessedLatLng: guessedLatLng,
                actualLatLng: actualLatLng,
                username: rankedScore.username
            }
            )

            if (rankedScore.rank === 1) {
                returnVal.push(
                    <Col xs={{ span: 8 }} md={3} lg={3} className='player-box-text-align-center player-box'>
                        <PlayerScoreBox rank={rankedScore.rank} score={rankedScore.score} username={rankedScore.username} />

                        <Button className="my-3 rank-score-button" variant="success" onClick={(event) => { showGuessedMapModal(individualActualVSGuessedLatLngPair) }}>View Guessed Location</Button>
                    </Col>
                )
            } else {
                returnVal.push(
                    <Col xs={6} md={3} lg={3} className='player-box-text-align-center player-box'>
                        <PlayerScoreBox rank={rankedScore.rank} score={rankedScore.score} username={rankedScore.username} />
                        <Button className="my-3 rank-score-button" variant="success" onClick={(event) => { showGuessedMapModal(individualActualVSGuessedLatLngPair) }}>View Guessed Location</Button>
                    </Col>
                )
            }

        }



        // console.log('GameResultBox else latLngData', guessedLatLngData);

        let container: JSX.Element = (
            <Carousel.Item>
                <div className='text-center'>
                    Last Round Score: Round {round}
                </div>
                <Container>
                    <Row className='result-score-ranking'>
                        {returnVal}
                    </Row>
                </Container>
            </Carousel.Item>

        );

        return container;
    }

    function showGuessedMapModal(data: {
        guessedLatLng: { lat: number, lng: number },
        actualLatLng: { lat: number, lng: number },
        username: string
    }[]) {
        setActualVSGuessedLatLng(data);
        setDisplayGuessedMapModal(true);
    }

    function closeGuessedModal() {
        setDisplayGuessedMapModal(false);
    }

    function rankTheScore(scores: { score: number, username: string, usersForCoop?: string[] }[]): { rank: number, score: number, username: string }[] {
        const retVal: { rank: number, score: number, username: string, usersForCoop?: string[] }[] = [];
        scores.sort(compareScore);

        let currRank = 1;
        for (const score of scores) {
            if (currRank > NUMBER_OF_TOP_USER) break;
            const theRankedScore: { rank: number, score: number, username: string, usersForCoop?: string[] } = {
                username: score.username,
                score: score.score,
                rank: currRank
            }
            if (score.usersForCoop) {
                theRankedScore.usersForCoop = score.usersForCoop;
            }
            retVal.push(theRankedScore);
            currRank++
        }

        return retVal;
    }

    function compareScore(a: { score: number, username: string }, b: { score: number, username: string }): number {
        if (a.score < b.score) return -1;
        else if (a.score > b.score) return 1;
        else return 0;
    }

    return <div>
        <Modal show={showModal} dialogClassName='game-result-modal' contentClassName="game-result-modal-content">
            <Modal.Body>
                <div>
                    <Carousel interval={300000} indicators={false}
                    >
                        {scoreResults}
                    </Carousel>
                </div>
            </Modal.Body>
            <Modal.Footer className='justify-content-center'>
                <Button className="rank-score-button" variant="secondary" onClick={closeResultLogic}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>

        <Modal show={displayGuessedMapModal} dialogClassName='game-result-modal' contentClassName="game-result-modal-content">
            <Modal.Header>
                <Modal.Title>Guessed Location</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <PlayerGuessResultMap
                    scriptSrc={MapsAPIURL}
                    actualVSGuessedLatLng={actualVSGuessedLatLng} />
            </Modal.Body>
            <Modal.Footer className='justify-content-center'>
                <Button variant="secondary" onClick={closeGuessedModal}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    </div>
}
