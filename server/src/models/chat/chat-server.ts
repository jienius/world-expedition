import { ChatBoxState, ChatMessage, ChatUser } from './chat-state';

export class ChatSystemServer {
    lastNamePool: string[] = [
        'Dolphin',
        'Whale',
        'Duck',
        'Kilin',
        'Dog',
        'Cat',
        'Turtle',
        'Dragon',
        'Eagle',
        'Phoenix',
        'Snowflake',
        'Leaf'
    ];

    firstNamePool: string[] = [
        'Colossal',
        'Giant',
        'Big',
        'Huge',
        'Normal',
        'Medium-sized',
        'Majestic',
        'Small',
        'Tiny',
        'Non-existent'
    ];

    theSystem: ChatUser = {
        username: 'The bot',
        isOnline: true,
        userSettings: {

        }
    }

    initialMessage: ChatMessage = {
        message: 'This is the start of the chat. To change username, type /name newname. To Change color, type /color hexcode',
        owner: this.theSystem,
        date: new Date()
    }

    chatMessages: ChatMessage[] = [this.initialMessage];

    userPools: ChatUser[] = [this.theSystem];


    socketDict: { [key: string]: string } = {

    }
    userDict: {[key: string]: ChatUser } = {
        'The bot': this.theSystem
    }

    state: ChatBoxState = {
        userPools: this.userPools,
        messages: this.chatMessages,
        lastUpdated: new Date()
    }

    getState(): ChatBoxState {
        this.state.lastUpdated = new Date();
        return this.state;
    }

    generateUser(): ChatUser {
        let username = this.firstNamePool[Math.floor(Math.random() * 10)] + ' ' + this.lastNamePool[Math.floor(Math.random() * 10)];
        while (this.userDict[username]) {
            username = this.firstNamePool[Math.floor(Math.random() * 10)] + ' ' + this.lastNamePool[Math.floor(Math.random() * 10)];
        }
        const newUser: ChatUser = {
            username,
            isOnline: true,
            userSettings: {

            }
        }
        this.userDict[username] = newUser;
        this.userPools.push(newUser);

        return newUser;
    }

    mapSocketIDToUserName(socketID: string, username: string): void {
        this.socketDict[socketID] = username;
    }

    takeUserOffline(socketID: string) {
        const username = this.socketDict[socketID];
        if (this.userDict[username]) this.userDict[username].isOnline = false;

    }

    getAUser(username: string): ChatUser {
        if (this.userDict[username]) {
            this.userDict[username].isOnline = true;
            return this.userDict[username];
        } else {
            return this.generateUser();
        }
    }

    changeUserName(oldUserName: string, newUserName: string): { success: boolean, msg: string } {
        if (this.userDict[newUserName]) {
            return {
                success: false,
                msg: 'Username has already been taken'
            };
        }
        if (this.userDict[oldUserName]) {
            this.userDict[newUserName] = this.userDict[oldUserName];
            this.userDict[oldUserName] = null;
            this.userDict[newUserName].username = newUserName;
            return {
                success: true,
                msg: 'Success'
            };
        } else {
            return {
                success: false,
                msg: 'Username does not exist'
            }
        }
    }

    addUserToState(user: ChatUser): void {
        this.userPools.push(user);
    }

    addNewMessage(message: string, username: string): void {
        const theUser = this.getAUser(username);
        const theMessage: ChatMessage = {
            owner: theUser,
            message,
            date: new Date()
        }
        this.chatMessages.push(theMessage);
        if (this.state.messages.length > 200) {
            this.state.messages = this.state.messages.slice(this.state.messages.length - 200);
        }
        this.updateStateDate();
    }

    updateStateDate(): void {
        this.state.lastUpdated = new Date();
    }


    handleCommands(username: string, command: string, commandParam: string): { username: string, success: boolean, msg?: string } {
        const retVal = {
            success: false,
            msg: '',
            username
        }
        switch (command) {
            case 'color':
                if (!commandParam || commandParam.length !== 6) {
                    retVal.msg = 'Color command argument should be RRGGBB.';
                    return retVal;
                } else {

                    if (!(/^[0-9A-F]{6}$/i.test(commandParam))) {
                        retVal.msg = 'Invalid color code.';
                    } else {
                        this.userDict[username].userSettings.color = commandParam;
                        this.updateStateDate();
                        retVal.success = true;
                    }
                }
                break;
            case 'name':
                if (commandParam) {
                    const tempRetVal = this.changeUserName(username, commandParam);
                    if (tempRetVal.success) {
                        retVal.success = tempRetVal.success;
                        retVal.username = commandParam;
                        this.updateStateDate();
                    } else {
                        retVal.msg = tempRetVal.msg;
                    }
                }
                break;
            default:
                retVal.msg = 'Invalid Command';
        }
        return retVal;
    }

}