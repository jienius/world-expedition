export interface RequestCollection {
    user: string,
    incFriendRequests: [
        {
            from: string,
            date: Date
        }
    ],
    pendingFriendRequests: [
        {
            to: string,
            date: Date
        }
    ],
    incGameRequests: {
        from: string,
        gameID: string,
        date: Date
    }[]
}