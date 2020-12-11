import React from 'react';
import { Col, Container, FormControl, InputGroup, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import { ChatBoxState, ChatMessage, ChatUser } from '../../lib/interface/chat-state';
import { ChatLog, NormMsg, OfflineDiv, OnlineDiv, OwnerMsg } from './chat-log';
import { socket } from '../../controller/socket';

type ChatWindowProps = { chatbox: ChatBoxState; username: string };
type ChatWindowState = { chatbox: ChatBoxState; username: string; messageTyped: string };
class ChatWindow extends React.Component<ChatWindowProps, ChatWindowState> {
  countdown: number = 0;
  messagesEnd: any;
  sendMessage() {
    console.log('value', this.state.messageTyped);
    let theMessage = this.state.messageTyped;
    if (theMessage && theMessage[0] !== '/') {
      socket.emit('chat--sendMessage', {
        username: this.state.username,
        message: this.state.messageTyped,
      });
      this.setState({ messageTyped: '' });
    } else if (theMessage && theMessage[0] === '/') {
      let messageArr = theMessage.slice(1, theMessage.length).split(' ');
      if (messageArr.length >= 2 && messageArr[0] && messageArr[1]) {
        const commandParams = messageArr.slice(1, messageArr.length).join(' ');
        socket.emit('chat--sendCommand', {
          username: this.state.username,
          command: messageArr[0],
          commandParam: commandParams,
        });
      }
      this.setState({ messageTyped: '' });
    }
  }

  constructor(props: ChatWindowProps) {
    super(props);
    this.state = {
      chatbox: {
        userPools: [],
        messages: [],
        lastUpdated: new Date('July 20, 99 00:20:18 GMT+00:00'),
      },
      username: this.props.username,
      messageTyped: '',
    };
    this.sendMessage = this.sendMessage.bind(this);
  }

  updateChatWindow(newChatBoxState: ChatBoxState) {
    this.setState(
      {
        chatbox: newChatBoxState,
      },
      () => this.scrollToBottom(),
    );
  }

  updateUserWindow(newChatBoxState: ChatBoxState) {
    this.setState(
      {
        chatbox: newChatBoxState,
      },
      () => this.scrollToBottom(),
    );
  }

  scrollToBottom() {
    console.log('in scrollToBottom');
    if (this.messagesEnd) this.messagesEnd.scrollTop = this.messagesEnd.scrollHeight;
  }

  componentDidUpdate(prevProps: ChatWindowProps, prevState: ChatWindowState, snapshot: any) {
    console.log('in componentDidUpdate');
    if (this.props.chatbox.lastUpdated.getTime() > prevProps.chatbox.lastUpdated.getTime()) {
      this.updateChatWindow(this.props.chatbox);
    }

    if (this.props.chatbox.lastUpdated.getTime() > prevProps.chatbox.lastUpdated.getTime()) {
      this.updateChatWindow(this.props.chatbox);
    }

    if (this.props.username !== prevProps.username) {
      this.setState({ username: this.props.username }, () => this.scrollToBottom());
    }
  }

  componentDidMount() {
    this.countdown = setInterval(() => {
      let newState = this.state;
      newState.chatbox.lastUpdated = new Date();
      this.setState(newState);
    }, 60000);
  }

  componentWillUnmount() {
    clearInterval(this.countdown);
  }

  getMessageOwnerDiv(message: ChatMessage): JSX.Element {
    let styles = {};
    if (message.owner.userSettings) {
      if (message.owner.userSettings['color']) {
        styles = {
          color: '#' + message.owner.userSettings['color'],
        };
      }
    }
    return (
      <div>
        <span style={styles}>{message.owner.username}</span> at{' '}
        {message.date ? this.getTimeAgo(message.date) : 'some time ago'} said:
      </div>
    );
  }

  getTimeAgo(date: Date): string {
    const currDateInSeconds = Date.now() / 1000;
    let dateInSeconds = date.getTime() / 1000;
    let timeDiff = currDateInSeconds - dateInSeconds;
    if (timeDiff < 60) {
      return 'just now';
    } else if (timeDiff < 3600) {
      return Math.floor(timeDiff / 60) + ' minutes ago';
    } else {
      return (
        date.getDate() +
        '/' +
        (date.getMonth() + 1) +
        '/' +
        date.getFullYear() +
        ' at ' +
        date.getHours() +
        ':' +
        date.getMinutes()
      );
    }
  }

  getMessageDiv(message: ChatMessage, username: string): JSX.Element {
    let retVal: JSX.Element;

    if (message.owner.username === username) {
      retVal = (
        <OwnerMsg
          dangerouslySetInnerHTML={{
            __html: this.convertEmojis(message.message),
          }}
        ></OwnerMsg>
      );
    } else {
      retVal = (
        <NormMsg
          dangerouslySetInnerHTML={{
            __html: this.convertEmojis(message.message),
          }}
        ></NormMsg>
      );
    }
    return retVal;
  }

  convertEmojis(message: string): string {
    let retVal = message.replace(':)', '<span>&#x1F600;</span>');
    retVal = retVal.replace(':D', '<span>&#x1F601;</span>');
    retVal = retVal.replace(':o', '<span>&#x1F62E;</span>');
    retVal = retVal.replace(':P', '<span>&#x1F61B;</span>');
    retVal = retVal.replace(':x', '<span>&#x1F637;</span>');
    return retVal;
  }

  getUserDiv(user: ChatUser): JSX.Element {
    let retVal: JSX.Element;
    let styles = {};
    if (user.userSettings) {
      if (user.userSettings['color']) {
        styles = {
          color: '#' + user.userSettings['color'],
        };
      }
    }

    retVal = (
      <div>
        {user.username === this.state.username ? (
          '(You)'
        ) : user.isOnline ? (
          <OnlineDiv>(Online)</OnlineDiv>
        ) : (
          <OfflineDiv>(Offline)</OfflineDiv>
        )}{' '}
        <span style={styles}>{user.username}</span>
      </div>
    );
    return retVal;
  }

  keyDownHandlerForChat = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      this.sendMessage();
    }
  };

  render() {
    const domMessage: any[] = [];

    const domUser: any[] = [];

    this.state.chatbox.userPools.forEach((user, index: number) => {
      domUser.push(
        <Row key={'user_' + index} className="flex-row-reverse ml-2 mr-1">
          {this.getUserDiv(user)}
        </Row>,
      );
    });

    this.state.chatbox.messages.forEach((message, index: number) => {
      domMessage.push(
        <Row key={'message_' + index} className="flex-column px-3">
          <Row className="ml-2">{this.getMessageOwnerDiv(message)}</Row>
          <Row className="ml-5 mr-2 text-left">
            {this.getMessageDiv(message, this.state.username)}
          </Row>
        </Row>,
      );
    });

    return (
      <React.Fragment>
        <Container className="d-flex justify-content-center flex-column align-items-center">
          <Row className="w-100 chat-log text-break">
            <Col
              xs={12}
              md={9}
              className="d-flex flex-column-reverse chat-log-window"
              ref={(el: any) => {
                this.messagesEnd = el;
              }}
            >
              <ChatLog>{domMessage}</ChatLog>
            </Col>
            <Col className="d-none d-lg-block" md={3}>
              {domUser}
            </Col>
          </Row>
          <br></br>
          <Row className="w-100">
            <InputGroup className="mb-3">
              <FormControl
                placeholder="Type something"
                aria-label="Type something"
                aria-describedby="basic-addon2"
                value={this.state.messageTyped}
                onChange={(e) => this.setState({ messageTyped: e.target.value })}
                onKeyDown={this.keyDownHandlerForChat}
              />
              <InputGroup.Append>
                <Button variant="primary" className="" onClick={this.sendMessage}>
                  Send
                </Button>
              </InputGroup.Append>
            </InputGroup>
          </Row>
        </Container>
      </React.Fragment>
    );
  }
}

export default ChatWindow;
