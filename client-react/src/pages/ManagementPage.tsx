import React, { useEffect, useState } from 'react';
import { RouteProps } from 'react-router-dom';
import { API, Auth } from 'aws-amplify';
import { Form, Alert } from 'react-bootstrap';

import UserItem from '../components/UserItem';

import './ManagementPage.css';
import '../App.css';

async function listUsersInGroup(group: string) {
  let apiName = 'AdminQueries';
  let path = '/listUsersInGroup';
  let myInit = {
    queryStringParameters: {
      groupname: group,
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${(await Auth.currentSession()).getAccessToken().getJwtToken()}`,
    },
  };
  return await API.get(apiName, path, myInit);
}

async function listUsers() {
  let apiName = 'AdminQueries';
  let path = '/listUsers';
  let myInit = {
    queryStringParameters: {},
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${(await Auth.currentSession()).getAccessToken().getJwtToken()}`,
    },
  };
  return await API.get(apiName, path, myInit);
}

export default function ManagementPage({ children, ...rest }: RouteProps) {
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filterUsers = () => {
    let newFilteredUsers: any[] = [];
    users.forEach((user: any) => {
      if (user.Username.includes(keyword)) {
        newFilteredUsers.push(user);
      }
    });
    return newFilteredUsers;
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([listUsersInGroup('Admin'), listUsers()])
      .then((value) => {
        let [admins, users] = value;
        admins = admins.Users.map((admin: any) => {
          return admin.Username;
        });
        users = users.Users.map((user: any) => {
          return admins.includes(user.Username)
            ? { ...user, isAdmin: true }
            : { ...user, isAdmin: false };
        });
        setUsers(users);
        setError('');
      })
      .catch(() => {
        setError('Loading users failed...');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="Container gameBckrnd">
      <div className="Content-container">
        <h1 className="Title">User Management</h1>
        {error !== '' && <Alert variant="danger">{error}</Alert>}
        {loading && <Alert variant="info">Loading...</Alert>}
        <Form.Control
          type="text"
          onChange={handleSearch}
          placeholder={'Search for users'}
          className="Search-bar"
        />
        {filterUsers().map((user: any) => (
          <UserItem
            key={user.Username}
            isAdmin={user.isAdmin}
            username={user.Username}
            enabled={user.Enabled}
          />
        ))}
      </div>
    </div>
  );
}
