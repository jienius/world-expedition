import React, { useState, useEffect } from 'react';
import { RouteProps } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import { socket } from '../controller/socket';
import Card from '../components/Card';
import '../App.css';

import './InsightsPage.css';

export default function InsightsPage({ children, ...rest }: RouteProps) {
  const [insight, setInsight] = useState({
    onlineUsers: 0,
    ongoingGames: 0,
    finishedGames: 0,
    totalRoundsPlayed: 0,
    singlePlayed: 0,
    hideAndSeekPlayed: 0,
    competitivePlayed: 0,
    coopPlayed: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    socket.emit('insight--get-insight');

    socket.on('insight--get-insight-result', (data: any) => {
      setLoading(false);
      setInsight(data);
    });
  }, []);

  return (
    <div className="Container gameBckrnd">
      <div className="Content-container">
        <h1 className="Title">App Insights</h1>
        {loading && <Alert variant="info">Loading...</Alert>}
        <div className="Insight-container">
          <Card title="Online Users:" stat={loading ? 'loading' : insight.onlineUsers} />
          <Card title="Ongoing Games:" stat={loading ? 'loading' : insight.ongoingGames} />
          <Card title="Finished Games:" stat={loading ? 'loading' : insight.finishedGames} />
          <Card title="Rounds Played:" stat={loading ? 'loading' : insight.totalRoundsPlayed} />
          <Card title="Single Mode Played:" stat={loading ? 'loading' : insight.singlePlayed} />
          <Card
            title="Hide and Seek Mode Played:"
            stat={loading ? 'loading' : insight.hideAndSeekPlayed}
          />
          <Card
            title="Competitive Mode Played:"
            stat={loading ? 'loading' : insight.competitivePlayed}
          />
          <Card title="Coop Mode Played:" stat={loading ? 'loading' : insight.coopPlayed} />
        </div>
      </div>
    </div>
  );
}
