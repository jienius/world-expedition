import React, { useEffect } from 'react';
import { Row, Col, Button, Modal, Spinner, Card } from 'react-bootstrap';
import { RouteProps } from 'react-router-dom';
import './GameInitPage.css';
import $ from 'jquery';
import { socket } from '../controller/socket';
import GamePage from './GamePage';
import GameHideNSeekPage from './GameHideNSeekPage';
import { GameObject, GAME_MODE_SINGLEPLAYER, GAME_MODE_COOP, GAME_STATUS_ENDED } from '../lib/interface/game';
import '../App.css';
// import singleplayerPic from './../assets/singleplayer-scaled.jpg'
import SinglePlayerCard from '../components/SinglePlayerCard';
import MultiplayerCard from '../components/MultiplayerCard';
import MultiplayerJoinCard from '../components/MultiplayerJoinCard';


export default function GameInitPage(props: { username: string }, { children, ...rest }: RouteProps) {

  const [roundTimeLimit, setRoundTimeLimit] = React.useState(0);
  const [numberOfRounds, setNumberOfRounds] = React.useState(1);
  const [gameCreated, setGameCreated] = React.useState({ created: false, gameID: '' });
  const [multiplayer_gamemode, setMultiplayerGameMode] = React.useState("Game Mode");
  const [join_gameId, setJoinGameId] = React.useState("");
  const [join_gameMode, setJoinGameMode] = React.useState("Game Mode");
  const [showQueueModel, setShowQueueModal] = React.useState(false);
  const [modalMessage, setModalMessage] = React.useState('You are in a queue...');
  const [currentGameMode, setCurrentGameMode] = React.useState("singleplayer-init");
  const [friendOptions, setFriendOptions] = React.useState<JSX.Element[]>([]);
  const [gameInvites, setGameInvites] = React.useState<JSX.Element[]>([]);
  const [showGameCreatingModal, setShowGameCreatingModal] = React.useState(false);
  let selectedFriends: any[] = [];

  // function movementToggle() {
  //   let movement_enabled = $("#movement-toggle").prop("checked");
  //   $("#movement-toggle-value").text(movement_enabled);
  // }

  useEffect(() => {
    // Server says singleplayer game instance is ready - start the game
    socket.on('game--created-sp-start', (data: any) => {
      // console.log('game--created-sp-start', data);
      setGameCreated({ created: true, gameID: data.gameID });
      setShowGameCreatingModal(false);
    });

    socket.on('game--currently-created', (data: any) => {
      setShowGameCreatingModal(true);
    });

    // Server says wait for other invited players to join private match
    socket.on('game--created-private-mp-wait', (data: any) => {
      // console.log('game--created-private-mp-wait', data);
      setJoinGameMode(data.gameMode);
      setJoinGameId(data.gameID);
      // setGameCreated({ created: true, gameID: data.gameID });
      setShowQueueModal(true);
      setShowGameCreatingModal(false);
      setModalMessage('Game found, waiting on players to join... ' + JSON.stringify(data));
    });

    // Server says invited players have joined private match - start the game
    socket.on('game--created-private-mp-start', (data: any) => {
      // console.log('game--created-private-mp-start', data);
      setModalMessage('');
      setShowQueueModal(false);
      setShowGameCreatingModal(false);
      setJoinGameMode(data.gameMode);
      setJoinGameId(data.gameID);
      setGameCreated({ created: true, gameID: data.gameID });
    });

    // Server says public matchmaking is looking for players
    socket.on('game--joined-queue-wait', (data: any) => {
      // console.log('game--joined-queue-wait', data);
      setModalMessage('You are now in a queue');
      setShowQueueModal(true);
    });

    // Server says public matchmaking has found a match - waiting for players to join

    socket.on('game--created-public-mp-found', (data: any) => {
      // console.log('game--created-public-mp-found', data);
      setModalMessage('Game found, current player ' + JSON.stringify(data));
    });

    // Server says public matchmaking has started a match - start the game    
    socket.on('game--created-public-mp-start', (data: any) => {
      // console.log('game--created-public-mp-start', data);
      setModalMessage('');
      setShowQueueModal(false);
      setShowGameCreatingModal(false);
      setGameCreated({ created: true, gameID: data.gameID });
    });

    // Server returns the list of friends    
    socket.on('game--get-friends-result', (data: any) => {
      // console.log('game--get-friends-result', data);
      if (data) {
        let tempFriendOptions = [];
        for (let i = 0; i < data.length; i++) {
          tempFriendOptions.push(<option key={'friend-option-key-' + i}>{data[i]}</option>);
        }
        // console.log("tempfriendOption", tempFriendOptions);
        setFriendOptions(tempFriendOptions);
      }
    });
    // Server returns the list of friends    
    socket.on('game--get-game-invites-result', (data: any) => {
      // console.log('game--get-game-invites-result', data);
      if (data?.incGameRequest) {
        let tempGameInvites = [];
        for (let i = 0; i < data.incGameRequest.length; i++) {
          tempGameInvites.push(<option value={data.incGameRequest[i].gameID} key={'game-invite-option-key-' + i}>{data.incGameRequest[i].gameID + ' - ' + data.incGameRequest[i].gameMode}</option>);
        }
        setGameInvites(tempGameInvites);
      }
    });

    socket.on('game--submit-join-invalid', (data: any) => {
      setModalMessage('You have joined a game that has been ended or cancelled.');
      setShowQueueModal(true);
      setJoinGameMode('');
      setJoinGameId('');
    });

    socket.on('game--game-cancelled', (data: any) => {
      setModalMessage('The game have been cancelled. Possible reason: ' + JSON.stringify(data));
      setShowQueueModal(true);
      setGameCreated({ created: false, gameID: '' });
    });

    return () => {
      socket.off('game--created-sp-start');
      socket.off('game--created-private-mp-wait');
      socket.off('game--created-private-mp-start');
      socket.off('game--joined-queue-wait');
      socket.off('game--created-public-mp-found');
      socket.off('game--created-public-mp-start');
      socket.off('game--get-friends-result');
      socket.off('game--get-game-invites-result');
      socket.off('game--submit-join-invalid');
    };
  }, []);

  useEffect(() => {
    socket.emit('game--get-friends', {
      username: props.username
    });

    socket.emit('game--get-game-invites', {
      username: props.username
    });
  }, [props.username]);

  // function submitSinglePlayRequest() {
  //   console.log('data', {
  //     roundTimeLimit,
  //     numberOfRounds,
  //     gameType: GAME_MODE_SINGLEPLAYER,
  //     username: props.username,
  //     players: []
  //   });

  //   socket.emit('game--submit-play', {
  //     username: props.username,
  //     roundTimeLimit,
  //     numberOfRounds,
  //     gameType: GAME_MODE_SINGLEPLAYER,
  //     players: []
  //   });

  // }

  function submitSinglePlayRequestWithData(data: { roundTimeLimit: number, numberOfRounds: number, enableMovement: boolean }) {


    socket.emit('game--submit-play', {
      roundTimeLimit: data.roundTimeLimit,
      numberOfRounds: data.numberOfRounds,
      gameType: GAME_MODE_SINGLEPLAYER,
      username: props.username,
      players: [],
      enableMovement: data.enableMovement
    });
  }

  // function submitMultiplayerRequest() {
  //   if (multiplayer_gamemode !== "Game Mode") {
  //     console.log('data', {
  //       username: props.username,
  //       // roundTimeLimit,              // Time limit and number of rounds are not customizable for multiplayer
  //       // numberOfRounds,
  //       gameType: multiplayer_gamemode.toLowerCase(),
  //       players: convertPlayersFormat()
  //     });

  //     socket.emit('game--submit-play', {
  //       username: props.username,
  //       // roundTimeLimit,              // Time limit and number of rounds are not customizable for multiplayer
  //       // numberOfRounds,
  //       gameType: multiplayer_gamemode.toLowerCase(),
  //       players: convertPlayersFormat()
  //     });
  //   }
  // }

  function submitMultiplayerCreateRequestWithData(data: { gameMode: string, friends: string[] }) {
    setCurrentGameMode('multiplayer-init');
    setMultiplayerGameMode(data.gameMode);
    if (data.gameMode) {
      socket.emit('game--submit-play', {
        username: props.username,
        gameType: data.gameMode,
        players: data.friends.length > 0 ? convertPlayersFormatWithData(data.friends) : null
      });
    }
  }

  function convertPlayersFormatWithData(rawPlayerlist: string[]): { username: string, checkedIn: boolean }[] {
    const playerlist: { username: string, checkedIn: boolean }[] = [];
    rawPlayerlist.forEach(player => {
      playerlist.push({ username: player, checkedIn: false });
    });
    return playerlist;
  }

  function convertPlayersFormat() {
    const playerlist: any[] = [];
    if (selectedFriends.length === 0) {
      return null;
    }
    selectedFriends.forEach(friend => {
      playerlist.push({ username: friend, checkedIn: false });
    });
    return playerlist;
  }

  function onSelectChangeFriend(event: any) {
    if (event) {
      const selectedFriendsTemp: any[] = []
      Array.from(event.target.selectedOptions).forEach((value: any) => {
        selectedFriendsTemp.push(value.value)
      }
      )
      selectedFriends = selectedFriendsTemp;
      // console.log('selectedFriends', selectedFriends);
    }
  }

  function onSelectChangeInvite(event: any) {
    if (event) {
      const selectedFriendsTemp: any[] = []
      Array.from(event.target.selectedOptions).forEach((value: any) => {
        selectedFriendsTemp.push(value.value)
      }
      )
      selectedFriends = selectedFriendsTemp;
      // console.log('selectedFriends', selectedFriends);
    }
  }

  function submitJoinGameRequest() {
    if (join_gameId !== "") {

      socket.emit('game--submit-join', {
        username: props.username,
        gameID: join_gameId,
        gameType: "join"
      });
    }
  }

  function submitJoinGameRequestWithData(data: { gameID: string }) {
    setCurrentGameMode('multiplayer-join');
    if (data.gameID) {

      socket.emit('game--submit-join', {
        username: props.username,
        gameID: data.gameID,
        gameType: "join"
      });
    }
  }

  function cancelQueue(gameType: string) {
    socket.emit('game--cancel-queue', { username: props.username, gameType })
    setShowGameCreatingModal(false);
    setShowQueueModal(false);
  }

  function cancelGame() {
    if (join_gameId) {
      socket.emit('game--cancel-game', { username: props.username, gameID: join_gameId });
    }
    setShowQueueModal(false);
  }

  function gameEndedLogic(data: { gameID: string, created: boolean }) {
    socket.emit('game--get-game-invites', {
      username: props.username
    });
    setGameCreated(data);
  }

  if (!gameCreated.created) {
    return (
      <>
        <div style={{ height: '100%', display: 'flex', }} className="w-100 gameBckrnd d-flex h-100 align-items-center justify-content-center">
          <div id="game-init-container" className="w-100">

            <div id="game-init-options">
              <Row>
                <Col xs={12} sm={12} md={4} lg={4} xl={4}>
                  <SinglePlayerCard playCallback={submitSinglePlayRequestWithData}></SinglePlayerCard>
                </Col>
                <Col xs={12} sm={12} md={4} lg={4} xl={4}>
                  <MultiplayerCard friendOptions={friendOptions} createCallback={submitMultiplayerCreateRequestWithData}></MultiplayerCard>
                </Col>
                <Col xs={12} sm={12} md={4} lg={4} xl={4}>
                  <MultiplayerJoinCard gameInvites={gameInvites} joinCallBack={submitJoinGameRequestWithData}></MultiplayerJoinCard>
                </Col>
              </Row>


            </div>

          </div>

          <Modal show={showQueueModel}>
            <Modal.Header closeButton>
              <Modal.Title>WAITING</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <p>{modalMessage}</p>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" onClick={event => { cancelQueue(multiplayer_gamemode); cancelGame() }}>Close</Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showGameCreatingModal}>
            <Modal.Header>
              <Modal.Title>CREATING GAME</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              Please wait while the game is being created...
              <Spinner animation="border" role="status">
                <span className="sr-only">Loading...</span>
              </Spinner>
            </Modal.Body>
          </Modal>
        </div>
      </>
    )
  } else if (gameCreated.created && currentGameMode === 'multiplayer-init' && multiplayer_gamemode === 'Hide-n-Seek') {
    return <GameHideNSeekPage username={props.username} gameID={gameCreated.gameID} gameEndedCallback={gameEndedLogic} />
  } else if (gameCreated.created && currentGameMode === 'multiplayer-join' && join_gameMode === 'hide-n-seek') {
    return <GameHideNSeekPage username={props.username} gameID={gameCreated.gameID} gameEndedCallback={gameEndedLogic} />
  } else {
    return <GamePage username={props.username} gameID={gameCreated.gameID} gameEndedCallback={gameEndedLogic} />
  }

}
