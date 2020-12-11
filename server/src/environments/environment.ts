// ####### To be included in here: The AWS Token and stuff to connect to AWS Cognito

import * as dotenv from 'dotenv';
dotenv.config()

interface EnvironmentVariable {
    di_loop: string;
    id_teilc: string;
    db_username: string;
    db_password: string;
    db_default_db: string;
    server_maps_k: string;
}

// console.log('process.env', process.env)

const envConfig: EnvironmentVariable = {
    di_loop: process.env.di_loop,
    id_teilc: process.env.id_teilc,
    db_username: process.env.db_username,
    db_password: process.env.db_password,
    db_default_db: process.env.db_default_db,
    server_maps_k: process.env.server_maps_k
}

console.log('envConfig', envConfig)

export default envConfig;