### Node Express template project

This is the backend developed for authentication with Amazon Cognito for User-related activities such as authentication, token validation, getting users, etc.

## About

The backend is equipped with ExpressJS, Typescript and SocketIO to deal with the basic time consuming errors on starting up a project

The backend will automatically compile and run after you save. The setting is in "nodemonConfig" in package.json

You must include the un-tracked .env file into the root folder, it will be provided on request in our Discord group

## How to run

The project has already been set up and ready to run, the main file is index.ts

Run the command `npm install` to initialize the project the first time (and after every pull from the git)

ALWAYS run `npm install` when you pull the project

Run the command `nodemon` for the server to start

## To connect to the database

The .env file must be present

Because of security, the database also only allows certain IP addresses to connect to it, please contact Minh for details

Resource on how to use the database once it's been set up:
https://www.w3schools.com/nodejs/nodejs_mongodb.asp

