import React, { useState, useEffect } from 'react';
import { RouteProps } from 'react-router-dom';
import Card from '../components/Card';
import { Alert } from 'react-bootstrap';
import { socket } from '../controller/socket';
import '../App.css';

export default function StatsPage(props: { username: string }, { children, ...rest }: RouteProps) {
  const [stats, setStats] = useState({
    numOfGames: 0,
    numOfSPGames: 0,
    numOfCompGames: 0,
    numOfCoOpGames: 0,
    numOfHideNSeekGames: 0,
    numOfCancelledGames: 0,
    favouriteMode: 'N/A',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getStats();
  }, []);

  useEffect(() => {
    socket.on('stats--return-info', (data: any) => {
      // console.log('stats--return-info', data);
      setStats({
        numOfGames: data.numOfGames1,
        numOfSPGames: data.numOfSPGames1,
        numOfCompGames: data.numOfCompGames1,
        numOfCoOpGames: data.numOfCoOpGames1,
        numOfHideNSeekGames: data.numOfHideNSeekGames1,
        numOfCancelledGames: data.numOfCancelledGames1,
        favouriteMode: data.favouriteMode1,
      });
      setLoading(false);
    });
  });

  function getStats() {
    setLoading(true);
    // console.log('stats--get-stats', props.username);
    socket.emit('stats--get-stats', props.username);
  }

  return (
    <div className="Container gameBckrnd">
      <h1 className="Title">User Statistics</h1>
      {loading && <Alert variant="info">Loading...</Alert>}
      <div className="Insight-container">
        {/* <Card title="Wins:" stat={loading ? 'loading' : stats.wins} />
        <Card title="Losses:" stat={loading ? 'loading' : stats.losses} /> */}
        {/* <Card title="Game hours:" stat={loading ? 'loading' : stats.gameHours} /> */}
        <Card title="Games Played:" stat={loading ? 'loading' : stats.numOfGames} />
        <Card title="Favourite Mode:" stat={loading ? 'loading' : stats.favouriteMode} />
        <Card
          title="Games of Single Player Played:"
          stat={loading ? 'loading' : stats.numOfSPGames}
        />
        <Card
          title="Games of Competitive Played:"
          stat={loading ? 'loading' : stats.numOfCompGames}
        />
        <Card
          title="Games of Co-operative Played:"
          stat={loading ? 'loading' : stats.numOfCoOpGames}
        />
        <Card
          title="Games of Hide 'N Seek Played:"
          stat={loading ? 'loading' : stats.numOfHideNSeekGames}
        />
        <Card title="Cancelled Games:" stat={loading ? 'loading' : stats.numOfCancelledGames} />
        {/* <Card title="Score Per Game:" stat={loading ? 'loading' : stats.scorePerGame} /> */}
      </div>
    </div>
  );
}
