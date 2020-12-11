import React, { useEffect } from 'react';
import { Button, InputGroup, FormControl, Tab, Form, Card, Row, Col } from 'react-bootstrap';
import { socket } from '../controller/socket';
import { RouteProps } from 'react-router-dom';
import '../App.css';


export default function FriendPage(props: { username: string }, { children, ...rest }: RouteProps) {

  const [searchName, setSearchName] = React.useState("");
  const [searchResult, setSearchResult] = React.useState("");
  const [selectedRequest, setSelectedRequest] = React.useState("");
  const [selectedFriend, setSelectedFriend] = React.useState("");
  const [myFriends, setMyFriends] = React.useState<JSX.Element[]>([])
  const [pendingRequests, setAllPendingRequests] = React.useState<JSX.Element[]>([]);
  const [incomingRequests, setAllIncomingRequests] = React.useState<JSX.Element[]>([]);

  useEffect(() => {
    socket.on('friend--search-friend-response', (data: any) => {
      // console.log('friend--search-friend-response', data);
      if (data?.user) {
        setSearchResult(data.user);
      }
      else {
        setSearchResult("");
      }
    });

    socket.on('friend--get-friend-response', (data: any) => {
      // console.log('friend--get-friend-response', data);
      if (data) {
        const friends = [];
        for (let i = 0; i < data.length; i++) {
          friends.push(<option key={'friend-key-' + i}>{data[i]}</option>);
        }
        setMyFriends(friends);
      }

    });

    socket.on('friend--user-get-requests-response', (data: any) => {
      // console.log('friend--user-get-requests-response', data);
      if (data.pendingFriendRequests) {
        let pend = [];
        for (let i = 0; i < data.pendingFriendRequests.length; i++) {
          pend.push(<option key={'pend-request-key-' + i}>{data.pendingFriendRequests[i].to}</option>);
        }
        setAllPendingRequests(pend);
      }

      if (data.incFriendRequests) {
        const inc = [];
        for (let i = 0; i < data.incFriendRequests.length; i++) {
          inc.push(<option key={'inc-request-key-' + i}>{data.incFriendRequests[i].from}</option>);
        }
        setAllIncomingRequests(inc);
      }

    });
  });
  useEffect(() => {
    getAllRequests();
    getFriends();
  }, []);


  function sendFriendRequest() {
    if (searchResult !== "") {
      socket.emit("friend--user-send-friend-request", { username: props.username, searchname: searchResult });
      setSearchResult("");
    }
  }

  function getAllRequests() {
    socket.emit("friend--user-get-all-requests", { username: props.username });
  }
  function getFriends() {
    socket.emit("friend--user-get-friend", { username: props.username });

  }
  function findFriendRequests() {
    if (searchName !== props.username) {
      socket.emit("friend--user-find-friend", { username: props.username, searchname: searchName });
    }
  }
  function acceptFriendRequest() {
    // console.log("selectedRequest", selectedRequest);
    if (selectedRequest) {
      socket.emit("friend--user-accept-friend-request", { username: props.username, searchname: selectedRequest });
    }

  }
  function rejectFriendRequest() {
    // console.log("selectedRequest", selectedRequest);
    if (selectedRequest) {
      socket.emit("friend--user-reject-friend-request", { username: props.username, searchname: selectedRequest });
    }
  }
  function removeFriend() {
    // console.log("remove selectedFriend", selectedFriend);
    if (selectedFriend) {
      socket.emit("friend--user-remove-friend", { username: props.username, searchname: selectedFriend });
    }
  }

  return (
    <>
      <div className="PageContent gameBckrnd">

        <Row>
          <h1 className="Header text-center">Friends</h1>
        </Row>

        <Row md={12} className="justify-content-center my-3">
          <Col md={8} className="justify-content-center">
            <Card className="py-3">

              <Card.Title className="h4 text-center">My Friends</Card.Title>

              <Card.Body>
                <Form.Group >
                  <Form.Control as="select" multiple onChange={((event) => {
                    setSelectedFriend(event.target.value);
                  })}>
                    {myFriends}
                  </Form.Control>
                </Form.Group>
              </Card.Body>
              <Row className="justify-content-center">
                <Button onClick={removeFriend}>Remove friend</Button>
              </Row>
            </Card>
          </Col>
        </Row>


        <Row className="justify-content-center my-3">
          <Col md={8} className="justify-content-center">
            <Card className="py-3">

              <Card.Title className="h4 text-center">Search for Friends</Card.Title>
              <Card.Body>
                <InputGroup className="mb-3">
                  <FormControl
                    placeholder="Username"
                    aria-label="Username"
                    aria-describedby="basic-addon1"
                    onChange={(event) => { setSearchName(event.target.value) }}
                  />
                  <Button id="friend-request-btn" onClick={findFriendRequests} >Search</Button>
                </InputGroup>


                <Row className="justify-content-center">
                  <Form.Group >
                    <Form.Control value={searchResult === "" ? "No User Found" : searchResult} readOnly>
                    </Form.Control>
                  </Form.Group>
                </Row>
                <Row className="justify-content-center">
                  <Button id="multiplayer-join-play-btn" onClick={sendFriendRequest}>Send request</Button>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="justify-content-around my-3">
          <Col md={6} className="mt-3">
            <Card className="py-3">
              <Card.Title className="text-center h4">Pending Requests</Card.Title>
              <Card.Body>
                <Form.Group >

                  <Form.Control as="select" multiple onChange={((event) => {
                    console.log("Select")
                  })} readOnly>
                    {pendingRequests}
                  </Form.Control>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} className="mt-3">
            <Card className="py-3">
              <Card.Title className="text-center h4">Incoming Requests</Card.Title>
              <Card.Body>
                <Form.Group >

                  <Form.Control as="select" multiple onChange={((event) => {
                    setSelectedRequest(event.target.value);
                  })}>
                    {incomingRequests}
                  </Form.Control>
                </Form.Group>

                <Row className="justify-content-center">
                  <Button id="accept-friend-btn" className="mx-3" onClick={acceptFriendRequest}>Accept</Button>
                  <Button id="reject-friend-btn" onClick={rejectFriendRequest}>Reject</Button>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}
