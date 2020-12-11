import React, { useEffect, useState } from 'react';
import { Button, Card, Carousel, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { GameObject } from '../lib/interface/game';
import rankOneImage from '../assets/rank-1-scaled.jpg';
import rankTwoImage from '../assets/rank-2-scaled.jpg';
import rankThreeImage from '../assets/rank-3-scaled.jpg';
import './PlayerScoreBox.css';

export default function PlayerScoreBox( props: { score: number , rank: number, username: string } ): JSX.Element {

    const [ rankPicUrl, setRankPicUrl ] = useState('');

    useEffect(() => {
        switch (props.rank) {
            case 1:
                setRankPicUrl(rankOneImage)
                break;

            case 2:
                setRankPicUrl(rankTwoImage)
                break;

            case 3:
                setRankPicUrl(rankThreeImage)
                break;
            default:
                break;
        }
    }, [props.rank])

    return <div className='player-score-box'>
        <Card>
            <Card.Header className='player-score-box-header'>
                <Card.Img className='picture-rank' variant="top" src={rankPicUrl} />
            </Card.Header>
            <Card.Body>
                <Card.Subtitle className='text-center'>{ props.username }</Card.Subtitle>
                <Card.Text className='text-center'>
                    Score: { props.score.toFixed(2) }
                </Card.Text>
            </Card.Body>
        </Card>
    </div>
}
