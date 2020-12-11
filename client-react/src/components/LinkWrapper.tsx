import React from 'react';
import { Link } from 'react-router-dom';
import './LinkWrapper.css';

const LinkWrapper = (props: any): JSX.Element => {
  return (
    <div className="LinkWrapper">
      <Link to={props.to}>
        {props.children}
        {props.text}
      </Link>
    </div>
  );
};

export default LinkWrapper;
