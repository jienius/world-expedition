import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Button, Modal, Table, Row, Col, Image } from 'react-bootstrap';
import { RouteProps, Prompt } from 'react-router-dom';
import GuessMap from '../components/PlayerGuessMap';
import StreetViewMap from '../components/PlayerStreetViewMap';
import { socket } from '../controller/socket';
import $ from 'jquery';
import MapsAPIURL from '../controller/googleMapAPIScript';
import ChatBox from '../components/ChatBox'
import './GamePage.css';
import Countdown from 'react-countdown';
import GameResultBox from '../components/GameResultBox';
import { GAME_MODE_COOP, MAX_ROUND_SCORE } from '../lib/interface/game';
import logo from '../assets/guessLogo.png'
import RoundResultBox from '../components/RoundResultBox';

export default function GamePage(props: { gameID: string, username: string, gameEndedCallback: ({ }: { gameID: string; created: boolean; }) => void }, { children, ...rest }: RouteProps) {

  // const [gameLngLatData, setGameLngLatData] = useState({ lat: 0, lng: 0 })
  const [showGuessModal, setShowGuessModal] = React.useState(false);
  const [roundCounters, setRoundCounters] = React.useState({ current: 1, total: 1 });
  const [showEndGameModal, setShowEndGameModal] = React.useState(false);
  const [showRoundEndModal, setShowRoundEndModal] = React.useState(false);

  const [submittedGuess, setSubmittedGuess] = React.useState(false);

  const [gameData, setGameData] = useState<any>(
    {
      currentRound: 1,
      latLngData: [
        { lat: 0, lng: 0 }
      ]
    }

  );
  // const [btnDisable, setBtnDisable] = useState(false);
  // const [guessBtnText, setGuessBtnText] = useState("Guess!");
  const [timeLeftAndKey, setTimeLeftAndKey] = useState({ timeLeft: 0, restart: 0 });
  const [scoreSum, setScoreSum] = useState(0);

  const OFFSET = 1; // LatlngData array is 0-index, currentRound starts at 1
  let timeIntervalID = 0;

  // let guessedLngLatData: { lat: number, lng: number } = { lat: 0, lng: 0 }

  const [guessedLngLatData, setGuessedLngLatDataHook] = useState({ lat: 0, lng: 0 })

  useEffect(() => {
    socket.emit('game--get-game-data', { username: props.username, gameID: props.gameID })
  }, [props.gameID]);

  useEffect(() => {
    socket.on('game--get-game-data-result', (data: any) => {
      // console.log('game--get-game-data-result', data);

      setGameData(data);
      calculateScore(data);
    });

    socket.on('game--end-game-data-result', (data: any) => {
      // console.log('game--end-game-data-result', data);
      setGameData(data);
      setShowEndGameModal(true);

    });

    socket.on('game--round-start', (data: any) => {
      // console.log('game--round-start', data);
      setSubmittedGuess(false);

      let timeLimitMinutes = data.timeLimitPerRound;
      setTimeLimitSeconds(timeLimitMinutes);
      if (data.currentRound > 1) {
        setShowRoundEndModal(true);
      }
    });

    socket.on('game--waiting-on-other-players', (data: any) => {
      // console.log('game--waiting-on-other-players', data);
      setSubmittedGuess(true);
    });

    return () => {
      socket.off('game--end-game-data-result');
      socket.off('game--get-game-data-result');
      socket.off('game--waiting-on-other-players');
    }
  }, []);

  function endTheGame() {
    setShowEndGameModal(false);
    props.gameEndedCallback({ gameID: '', created: false });
  }
  function endTheRound() {
    setShowRoundEndModal(false);
  }
  function setTimeLimitSeconds(timeLimitMinutes: number) {
    // console.log('setTimeLimitSeconds', timeLimitMinutes);
    if (timeLimitMinutes) {
      let timeLeftSeconds = timeLimitMinutes * 60;
      let restartK = Date.now();   // TODO Update to timeLimit * 60
      setTimeLeftAndKey({ timeLeft: timeLeftSeconds * 1000 + Date.now(), restart: restartK });
    }
  }

  function get_time(time_in_seconds: number) {
    let hours = Math.floor(time_in_seconds / 3600);
    let minutes = Math.floor((time_in_seconds - (hours * 3600)) / 60);
    let seconds = time_in_seconds - (hours * 3600) - (minutes * 60);
    return hours + ' hour : ' + minutes + ' minute(s) :' + seconds + ' second(s)'
  }

  function submitGuess() {
    setShowGuessModal(false);
    const data = {
      currentRound: gameData.currentRound,
      username: props.username,
      gameID: props.gameID,
      guessedLatLng: {
        lat: guessedLngLatData.lat,
        lng: guessedLngLatData.lng
      },
      actualLatLng: {
        lat: gameData.latLngData[gameData.currentRound - OFFSET].lat,
        lng: gameData.latLngData[gameData.currentRound - OFFSET].lng
      },
      numberOfRound: gameData.numberOfRound
    }
    // console.log('data to submit', data);
    if (!submittedGuess) {
      socket.emit('game--update-game-data', data);
      setSubmittedGuess(true);
    }
  }

  function calculateScore(data: any) {
    let score = 0;
    if (data.gameType === GAME_MODE_COOP) {
      let totalScore = 0;
      for (let round = 1; round < data.currentRound + 1; round++) {
        let lowestScore = MAX_ROUND_SCORE;
        for (const user of data.users) {
          if (data.scores[user.username]['round-' + round] < lowestScore) {
            lowestScore = data.scores[user.username]['round-' + round];
          }
          if (lowestScore === MAX_ROUND_SCORE) {
            lowestScore = 0;
          }
        };
        totalScore += lowestScore;
      };

      score = totalScore;
    }
    else {
      console.log(" Not Co-op");
      let totalScore = 0;
      for (let round = 1; round < data.currentRound + 1; round++) {
        if (data.scores[props.username]['round-' + round] !== MAX_ROUND_SCORE) {
          totalScore += data.scores[props.username]['round-' + round];
        }
      }
      score = totalScore;
    }
    setScoreSum(score);

  }

  function setGuessedLngLatData(value: { lat: number, lng: number }) {
    // guessedLngLatData = value;
    setGuessedLngLatDataHook(value);
    // console.log('setGuessedLngLatData', guessedLngLatData);
  }

  function showGuessModalHook() {
    setShowGuessModal(true);
  }

  return (
    <>
      <Prompt when={true}

        message={(location, action) => {

          // console.log('location', location);
          // console.log('action', action);

          if (window.confirm('Leaving a game will cancel it, proceed?')) {
            socket.emit('game--cancel-game', {
              username: props.username,
              gameID: props.gameID
            });
            return true;
          }
          return false;
        }}
      />
      {/* <Button className="open-guess-ux-btn" onClick={showGuessModalHook}>Guess</Button> */}

      <Table className="round-status-table" variant="dark" responsive size="sm">
        <thead>
          <tr>
            <th className="h3 font-weight-bold">Time</th>
            <th className="h3 font-weight-bold">Round</th>
            <th className="h3 font-weight-bold">Score</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td id="round-time-left-indicator" className="h4">{timeLeftAndKey.timeLeft === 0 ? <span>&#8734;</span> : <Countdown date={timeLeftAndKey.timeLeft} autoStart={true} onComplete={submitGuess} key={timeLeftAndKey.restart}></Countdown>}</td>
            <td className="h5 ">{gameData.currentRound}/{gameData.numberOfRound}</td>
            <td className="h5">{scoreSum.toFixed(0)}</td>
          </tr>
        </tbody>
      </Table>
      <div className="street-view-container-gamepage">
        <StreetViewMap
          lat={gameData.latLngData[gameData.currentRound - OFFSET].lat}
          lng={gameData?.latLngData[gameData.currentRound - OFFSET].lng}
          enableMovement={gameData.enableMovement}
          scriptSrc={MapsAPIURL}
          bottomLeftCallBack={showGuessModalHook}
        />
      </div>

      <Row className="flex-row-reverse fix2bottom align-items-center justify-content-center w-100">
        <Col xs={12} className="mt-3">
          <ChatBox username={props.username} gameID={props.gameID} gameType={gameData.gameType} />
        </Col>
      </Row>

      <Modal show={showGuessModal} onHide={() => setShowGuessModal(false)} dialogClassName="guess-map-modal" contentClassName="guess-map-modal-content">
        <Modal.Header closeButton={true}>
          <Modal.Title className="text-center">Where do you think you are?</Modal.Title>
        </Modal.Header>

        <Modal.Body>

          <GuessMap lat={0} lng={0} callback={setGuessedLngLatData} scriptSrc={MapsAPIURL}></GuessMap>

        </Modal.Body>

        <Modal.Footer>

          <Button id="game-guess-btn" variant='primary' onClick={submitGuess} disabled={submittedGuess} block>
            {submittedGuess ? 'Waiting on other players...' : 'Guess!'}
          </Button>

        </Modal.Footer>
      </Modal>
      <GameResultBox theGame={gameData} show={showEndGameModal} callback={endTheGame} username={props.username} />
      <RoundResultBox theGame={gameData} show={showRoundEndModal} callback={endTheRound} username={props.username} />

    </>
  )
}
