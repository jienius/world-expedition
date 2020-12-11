import React, { useEffect, useState } from 'react';
import { Button, Modal, Table, Row, Col, Image } from 'react-bootstrap';
import { Prompt, RouteProps } from 'react-router-dom';
import GuessMap from '../components/PlayerGuessMap';
import StreetViewMap from '../components/PlayerStreetViewMap';
import { socket } from '../controller/socket';
import $ from 'jquery';
import './GameHideNSeekPage.css';
import MapsAPIURL from '../controller/googleMapAPIScript';
import GameResultBox from '../components/GameResultBox';
import RoundResultBox from '../components/RoundResultBox';
import logo from '../assets/guessLogo.png'
import ChatBox from '../components/ChatBox'
import { MAX_ROUND_SCORE } from '../lib/interface/game';

export default function GameHideNSeekPage(props: { gameID: string, username: string, gameEndedCallback: ({ }: { gameID: string; created: boolean; }) => void }, { children, ...rest }: RouteProps) {

  const [showEndGameModal, setShowEndGameModal] = React.useState(false);
  const [showRoundEndModal, setShowRoundEndModal] = React.useState(false);

  const [gamePlacedLngLatData, setPlacedGameLngLatData] = useState({ lat: 0, lng: 0 });
  const [gameGuessedLngLatData, setGameGuessedLngLatData] = useState({ lat: 0, lng: 0 });
  const [showGuessModal, setShowGuessModal] = React.useState(false);

  const [gameData, setGameData] = useState<any>(
    {
      currentRound: 1,
      latLngData: [
        { lat: 0, lng: 0 }
      ],
      currentPhase: 'setup'
    }

  );
  const [btnGuessDisable, setGuessBtnDisable] = useState(false);
  const [btnPlaceDisable, setPlaceBtnDisable] = useState(false);
  const [guessBtnText, setGuessBtnText] = useState("Guess!");
  const [placeBtnText, setPlaceBtnText] = useState("Let's go!");
  const [modalMessage, setModalMessage] = useState('Click a location to send your opponent!');
  const [scoreSum, setScoreSum] = useState(0);
  const [errorOnPlacedLatLng, setErrorOnPlacedLatLng] = useState(false);


  let guessedLngLatData: { lat: number, lng: number } = { lat: 0, lng: 0 }
  let placedLngLatData: { lat: number, lng: number } = { lat: 0, lng: 0 }


  useEffect(() => {
    socket.emit('game--get-game-data', { username: props.username, gameID: props.gameID })
  }, [props.gameID]);

  useEffect(() => {
    socket.on('game--get-game-data-result', (data: any) => {
      // console.log('game--get-game-data-result', data);
      calculateScore(data);
      setGameData(data);

    });

    socket.on('game--end-game-data-result', (data: any) => {
      // console.log('game--end-game-data-result', data);
      setGameData(data);
      //alert('game ended');
      setShowEndGameModal(true);
    });

    socket.on('game--phase-start', (data: any) => {
      // console.log('game--phase-start', data);
      setShowGuessModal(false);
      if (data.currentPhase === "setup") {
        if (data.currentRound >= 1) {
          setShowRoundEndModal(true);
        }

        setPlaceBtnDisable(false);
        setPlaceBtnText("Place the other player!");
        setModalMessage("Select where you want the other player to be sent!");
      } else if (data.currentPhase === "play") {
        setGuessBtnDisable(false);
        setGuessBtnText("Guess!");
      } else {
        console.log("CLIENT ERROR: Unexpected Hide and Seek game phase");
      }

    });

    socket.on('game--waiting-on-other-players', (data: any) => {
      // console.log('game--waiting-on-other-players', data);
      if (data.currentPhase === "setup") {
        // show your modal
        setPlaceBtnDisable(true);
        setPlaceBtnText("Waiting on other players...");
        setModalMessage('Waiting on other players...')
      } else if (data.currentPhase === "play") {
        // remove modal
        setGuessBtnDisable(true);
        setGuessBtnText("Waiting on other players...");
      } else {
        console.error("CLIENT ERROR: Unexpected Hide and Seek game phase");
      }
    });

    // returned function will be called on component unmount 
    return () => {
      socket.off('game--end-game-data-result');
      socket.off('game--get-game-data-result');
      socket.off('game--phase-start');
      socket.off('game--waiting-on-other-players');
    }
  }, []);

  function updateTheGame() {

  }
  function endTheGame() {
    setShowEndGameModal(false);
    props.gameEndedCallback({ gameID: '', created: false });
  }
  function endTheRound() {
    setShowRoundEndModal(false);
  }
  function submitData() {
    if (gameData.currentPhase === "setup") {
      locationValid(gamePlacedLngLatData).then(dataChecked => {
        if (dataChecked.valid) {
          const data = {
            currentRound: gameData.currentRound,
            username: props.username,
            gameID: props.gameID,
            guessedLatLng: gameGuessedLngLatData,
            actualLatLng: {
              lat: gameData.latLngData[props.username]['round-' + gameData.currentRound].lat,
              lng: gameData.latLngData[props.username]['round-' + gameData.currentRound].lng
            },
            placedLatLng: { lat: dataChecked.lat, lng: dataChecked.lng },
            numberOfRound: gameData.numberOfRound
          }
          // console.log('game--update-hidenseek-game-data', data);
          socket.emit('game--update-hidenseek-game-data', data);
        } else {
          // show err modal
          setErrorOnPlacedLatLng(true);
        }
      }).catch(err => {
        console.error(err);
      });
    } else {
      const data = {
        currentRound: gameData.currentRound,
        username: props.username,
        gameID: props.gameID,
        guessedLatLng: gameGuessedLngLatData,
        actualLatLng: {
          lat: gameData.latLngData[props.username]['round-' + gameData.currentRound].lat,
          lng: gameData.latLngData[props.username]['round-' + gameData.currentRound].lng
        },
        placedLatLng: gamePlacedLngLatData,
        numberOfRound: gameData.numberOfRound
      }
      // console.log('game--update-hidenseek-game-data', data);
      socket.emit('game--update-hidenseek-game-data', data);
    }
  }

  function setGuessedLngLatData(value: { lat: number, lng: number }) {
    guessedLngLatData = value;
    // console.log('setGuessedLngLatData', guessedLngLatData);
    setGameGuessedLngLatData(value);
  }

  function setPlacedLngLatData(value: { lat: number, lng: number }) {
    placedLngLatData = value;
    // console.log('setPlacedGameLngLatData', value);
    setPlacedGameLngLatData(value);
  }
  function showGuessModalHook() {
    setShowGuessModal(true);
  }

  function calculateScore(data: any) {
    let totalScore = 0;
    for (let round = 1; round < data.currentRound + 1; round++) {
      if (data.scores[props.username]['round-' + round] !== MAX_ROUND_SCORE) {
        totalScore += data.scores[props.username]['round-' + round];
      }
    }

    setScoreSum(totalScore);
  }

  async function locationValid(
    data: { lat: number, lng: number }
  ): Promise<{ lat: number; lng: number; valid: boolean }> {
    const lat = Number(data.lat);
    const lng = Number(data.lng);
    let valid = false;
    const mapsMetadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${data.lat},${data.lng}&key=${process.env.REACT_APP_maps_k}`;

    const response = await fetch(mapsMetadataUrl);
    if (response.ok) {
      // console.log('response.ok', response);
      const validationData = await response.json();
      if (validationData.status === "OK") valid = true;

    }
    return { lat, lng, valid };
  }

  if (gameData.currentPhase === "setup") {
    return (<div style={{ width: '100%', height: '100%' }}>
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
      <Modal show={!showRoundEndModal && !showEndGameModal} onHide={() => { }}>
        <Modal.Header closeButton={false}>
          <Modal.Title>Round Start!</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p>{modalMessage}</p>
          <div id="place-map-container">
            <GuessMap enablePegman={true} lat={0} lng={0} callback={setPlacedLngLatData} scriptSrc={MapsAPIURL}></GuessMap>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button block id="game-place-btn" variant='primary' onClick={submitData} disabled={btnPlaceDisable}>
            {placeBtnText}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={errorOnPlacedLatLng} onHide={() => setErrorOnPlacedLatLng(false)}>
        <Modal.Header closeButton={false}>
          <Modal.Title>Opps! There's no Street View there! &#128531;</Modal.Title>
        </Modal.Header>
        <Modal.Footer>
          <Button block id="game-place-btn" variant='danger' onClick={(event) => { setErrorOnPlacedLatLng(false); }}>
            Try Again
          </Button>
        </Modal.Footer>
      </Modal>

      <GameResultBox theGame={gameData}
        show={showEndGameModal}
        callback={endTheGame}
        username={props.username} />
      <RoundResultBox theGame={gameData}
        show={showRoundEndModal}
        callback={endTheRound}
        username={props.username} />
    </div>)
  } else {
    return (
      <div style={{ width: '100%', height: '100%' }}>
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
              <td id="round-time-left-indicator" className="h4"><span>&#8734;</span></td>
              <td className="h5 ">{gameData.currentRound}/{gameData.numberOfRound}</td>
              <td className="h5">{scoreSum.toFixed(0)}</td>
            </tr>
          </tbody>
        </Table>

        <StreetViewMap
          lat={gameData?.latLngData[props.username]['round-' + gameData.currentRound]?.lat || 0}
          lng={gameData?.latLngData[props.username]['round-' + gameData.currentRound]?.lng || 0}
          enableMovement={gameData.enableMovement}
          scriptSrc={MapsAPIURL}
          bottomLeftCallBack={showGuessModalHook}
        />

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

            <GuessMap lat={0} lng={0} callback={setGuessedLngLatData} scriptSrc={MapsAPIURL} />

          </Modal.Body>

          <Modal.Footer>

            <Button block id="game-guess-btn" variant='primary' onClick={submitData} disabled={btnGuessDisable}>
              {guessBtnText}
            </Button>

          </Modal.Footer>
        </Modal>

      </div>)
  }

}
