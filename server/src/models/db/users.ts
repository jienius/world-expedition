export interface UserCollection {
    user: string,
    onlineStatus: boolean,
    profile: {
        win: number,
        lose: number
    },
    friends: { name: string }[]
}


export interface RequestCollection {
    incGameRequests: [],
    incFriendRequests: [],
    pendingFriendRequests: []
}
