import { ChatBoxState, ChatUser } from "./chat-state";

export interface GenericSocketIncMsg {
    isValid: boolean,
    errorMessage?: string
}


export interface InitializationMessage extends NewStateMessage {
    username: string;
    user: ChatUser
}

export interface NewStateMessage extends GenericSocketIncMsg {
    chatBoxState: ChatBoxState
}

export interface CommandResult {
    username: string;
    success: boolean;
    msg: string;
}



