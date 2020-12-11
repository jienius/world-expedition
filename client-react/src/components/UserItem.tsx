import React, { useState, useEffect } from 'react';
import { Button, Alert } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import defaultAvatar from '../assets/defaultAvatar.png';
import Avatar from 'react-avatar';
import { Storage } from 'aws-amplify';

import './UserItem.css';
import { promises } from 'dns';

async function disableUser(username: string) {
  let apiName = 'AdminQueries';
  let path = '/disableUser';
  let myInit = {
    body: {
      username,
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${(await Auth.currentSession()).getAccessToken().getJwtToken()}`,
    },
  };
  return await API.post(apiName, path, myInit);
}

async function enableUser(username: string) {
  let apiName = 'AdminQueries';
  let path = '/enableUser';
  let myInit = {
    body: {
      username,
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${(await Auth.currentSession()).getAccessToken().getJwtToken()}`,
    },
  };
  return await API.post(apiName, path, myInit);
}

const UserItem = (props: any) => {
  const [enabled, setEnabled] = useState(props.enabled);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatar, setAvatar] = useState(defaultAvatar);

  const generateStatus = () => {
    if (props.isAdmin) {
      return 'Admin';
    }
    if (isLoading) {
      return enabled ? 'Disabling...' : 'Enabling...';
    } else {
      return enabled ? 'Disable' : 'Enable';
    }
  };

  useEffect(() => {
    const filename = props.username + '_avatar.png';
    Storage.get(filename, { level: 'public' }).then((url) => {
      const myRequest = new Request(url as string);
      fetch(myRequest).then(function (response) {
        if (response.status === 200) {
          setAvatar(url as string);
        }
      });
    });
  });

  return (
    <div>
      <div className="User-item-container">
        <Avatar src={avatar} />
        <div className="Username-container">
          <div className="Username">{props.username}</div>
        </div>
        <Button
          className="User-item-button"
          disabled={props.isAdmin || isLoading}
          variant="danger"
          onClick={
            enabled
              ? () => {
                  disableUser(props.username)
                    .then(() => {
                      setEnabled(!enabled);
                      setError('');
                    })
                    .catch(() => {
                      console.log(error);
                      setError('Disable user failed');
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                }
              : () => {
                  enableUser(props.username)
                    .then(() => {
                      setEnabled(!enabled);
                      setError('');
                    })
                    .catch(() => {
                      setError('Enable user failed');
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                  setLoading(true);
                }
          }
        >
          {generateStatus()}
        </Button>
      </div>
      {error !== '' && <Alert variant="danger">{error}</Alert>}
    </div>
  );
};

export default UserItem;
