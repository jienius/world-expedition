export interface User {
    username: string,
    address: string,
    birthdate: Date,
    gender: string,
    name: string,
    phone_number: string,
    email: string,
    isAdmin: boolean
}

export interface UserTokens {
    username: string,
    accessToken: string,
    idToken: string,
    refreshToken: string
}
