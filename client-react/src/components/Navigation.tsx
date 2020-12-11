import React, { useContext } from 'react';

import './Navigation.css';
import LinkWrapper from './LinkWrapper';
import { ReactComponent as Play } from '../assets/play.svg';
import { ReactComponent as Profile } from '../assets/profile.svg';
import { ReactComponent as Friends } from '../assets/friends.svg';
import { ReactComponent as Stats } from '../assets/stats.svg';
import { ReactComponent as Insight } from '../assets/insight.svg';
import { ReactComponent as Management } from '../assets/management.svg';
import Logo from '../assets/World_Expedition_Logo_No_Name.png';
import AdminContext from '../hooks/AdminContext';
import AvatarContext from '../hooks/AvatarContext';
import { Button } from 'react-bootstrap';
import { Auth } from 'aws-amplify';
import Avatar from 'react-avatar';

const Navigation = (): JSX.Element => {
  const isAdmin = useContext(AdminContext);
  const { avatar } = useContext(AvatarContext);

  return (
    <>
      <div className="Navigation background mx-0">
        <ul>
          <li>
            <img src={Logo} className="Logo" />
          </li>
          <li className="h4 my-4">World Expedition</li>
          <li>
            <LinkWrapper to={'gameinit'} text={'Play'}>
              <Play />
            </LinkWrapper>
          </li>
          <li>
            <LinkWrapper to={'profile'} text={'Profile'}>
              <Profile />
            </LinkWrapper>
          </li>
          <li>
            <LinkWrapper to={'friends'} text={'Friends'}>
              <Friends />
            </LinkWrapper>
          </li>
          <li>
            <LinkWrapper to={'stats'} text={'Statistics'}>
              <Stats />
            </LinkWrapper>
          </li>
          {isAdmin && (
            <li>
              <LinkWrapper to={'insights'} text={'App Insights'}>
                <Insight />
              </LinkWrapper>
            </li>
          )}
          {isAdmin && (
            <li>
              <LinkWrapper to={'management'} text={'Management'}>
                <Management />
              </LinkWrapper>
            </li>
          )}
          <li className="Signout">
            <Avatar src={avatar} />
            <Button
              className="Signout-btn"
              variant="warning"
              aria-label="LOGOUT"
              onClick={() => {
                Auth.signOut();
              }}
            >
              Sign out
          </Button>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Navigation;
