import React, { useEffect, useState } from 'react';

import './App.css';
import { socket } from './controller/socket';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
  useHistory,
  useLocation,
} from 'react-router-dom';

import { Auth, Hub, Storage } from 'aws-amplify';
import { AmplifyAuthenticator, AmplifySignIn, AmplifySignUp } from '@aws-amplify/ui-react';

import AdminContext from './hooks/AdminContext';
import UsernameContext from './hooks/UsernameContext';
import FriendsPage from './pages/FriendsPage';
import GameInitPage from './pages/GameInitPage';
import GamePage from './pages/GamePage';
import ProfilePage from './pages/ProfilePage';
import StatsPage from './pages/StatsPage';
import PageLayout from './components/PageLayout';
import InsightsPage from './pages/InsightsPage';
import ManagementPage from './pages/ManagementPage';
import MapsAPIURL from './controller/googleMapAPIScript';
import AvatarContext from './hooks/AvatarContext';
import defaultAvatar from './assets/defaultAvatar.png';

function App() {
  socket.on('global--initialization-result', (data: any) => {
    // console.log('connected to the server', data);
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUserName] = useState('');
  const [avatar, setAvatar] = useState(defaultAvatar);

  useEffect(() => {
    Auth.currentAuthenticatedUser({ bypassCache: true }).then((user) => {
      // console.log('currentAuthenticatedUser', user);
      if (user.signInUserSession.idToken.payload['cognito:groups']) {
        setIsAdmin(user.signInUserSession.idToken.payload['cognito:groups'].includes('Admin'));
      } else {
        setIsAdmin(false);
      }
      if (user.username) {
        socket.emit('auth--user-logged-in', { username: user.username });
        setUserName(user.username);
      }
    });

    Hub.listen('auth', (data) => {
      switch (data.payload.event) {
        case 'signIn':
          console.log(data);
          socket.emit('auth--user-logged-in', { username: data.payload.data.username });
          setUserName(data.payload.data.username);
          break;
        case 'signOut':
          console.log(data);
          socket.emit('auth--user-logged-out', { username: data.payload.data.username });
          setUserName(data.payload.data.username);
          break;
        case 'signUp':
          console.log(data);
          socket.emit('auth--user-signed-up', { username: data.payload.data.username });
          setUserName(data.payload.data.username);
          break;
        default:
          break;
      }
    });

    let script = document.querySelector(`script[src="${MapsAPIURL}"]`);
    if (!script) {
      // Create script
      const googleMapScript = document.createElement('script');
      // when using https, switch to https
      if (googleMapScript) {
        const url = MapsAPIURL;
        googleMapScript.src = url;
        googleMapScript.async = true;
        googleMapScript.setAttribute('data-status', 'loading');
        // Add script to document body
        document.body.appendChild(googleMapScript);

        googleMapScript.addEventListener('error', () => { });
      }
    }
  }, [username]);

  useEffect(() => {
    if (username !== '') {
      const filename = username + '_avatar.png';
      Storage.get(filename, { level: 'public' })
        .then((url) => {
          const myRequest = new Request(url as string);
          fetch(myRequest).then(function (response) {
            if (response.status === 200) {
              setAvatar(url as string);
            }
          });
        })
        .catch((err) => console.log(err));
    }
  }, [username]);

  return (
    <>
      <AdminContext.Provider value={isAdmin}>
        <UsernameContext.Provider value={username}>
          <AvatarContext.Provider value={{ avatar, setAvatar }}>
            <AmplifyAuthenticator usernameAlias="username">
              <AmplifySignUp
                slot="sign-up"
                usernameAlias="username"
                formFields={[
                  {
                    type: 'username',
                    label: 'Username',
                    placeholder: 'Enter your username',
                    required: true,
                  },
                  {
                    type: 'email',
                    label: 'Email',
                    placeholder: 'Enter your email',
                    required: true,
                  },
                  {
                    type: 'password',
                    label: 'Password',
                    placeholder: 'Enter your password',
                    required: true,
                  },
                ]}
              />
              <AmplifySignIn slot="sign-in" usernameAlias="username" />
              <Router>
                <Switch>
                  <Route path="/friends">
                    <PageLayout>
                      <FriendsPage username={username} />
                    </PageLayout>
                  </Route>
                  <Route path="/gameinit">
                    <PageLayout>
                      <GameInitPage username={username} />
                    </PageLayout>
                  </Route>
                  {/* <Route path="/play">
              <PageLayout>
                <GamePage />
              </PageLayout>
            </Route> */}
                  <Route path="/profile">
                    <PageLayout>
                      <ProfilePage />
                    </PageLayout>
                  </Route>
                  <Route path="/stats">
                    <PageLayout>
                      <StatsPage username={username} />
                    </PageLayout>
                  </Route>
                  {isAdmin && (
                    <Route path="/insights">
                      <PageLayout>
                        <InsightsPage />
                      </PageLayout>
                    </Route>
                  )}
                  {isAdmin && (
                    <Route path="/management">
                      <PageLayout>
                        <ManagementPage />
                      </PageLayout>
                    </Route>
                  )}
                  <Route path="/">
                    <PageLayout>
                      <GameInitPage username={username} />
                    </PageLayout>
                  </Route>
                </Switch>
              </Router>
            </AmplifyAuthenticator>
          </AvatarContext.Provider>
        </UsernameContext.Provider>
      </AdminContext.Provider>
    </>
  );
}

export default App;
