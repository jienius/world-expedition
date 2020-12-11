import { ChatBoxState, ChatUser } from "./chat/chat-state";

export interface GenericSocketOutMsg {
    isValid: boolean,
    errorMessage?: string
}


export interface InitializationMessage extends NewStateMessage {
    username: string;
    user: ChatUser
}

export interface NewStateMessage extends GenericSocketOutMsg {
    chatBoxState: ChatBoxState
}


