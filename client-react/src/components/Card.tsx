import React from 'react';
import './Card.css';

const Card = (props: any): JSX.Element => {
  return (
    <div className="Card-container">
      <div className="Card">
        <div className="Card-title">{props.title}</div>
        <div className="Card-stats-container">
          <div className="Card-stats">{props.stat}</div>
        </div>
      </div>
    </div>
  );
};

export default Card;
