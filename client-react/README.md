# The official front end for World Expedition Project

This front end was created with React, equipped with React-bootstrap, Typescript, SocketIO and React-router-dom to handle basic security stuff.

### Running for the first time

1. Install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
2. Run `aws configure` with aws_access_key_id and aws_secret_access_key in the heaven env, please do not share it with anyone!
3. Run `sudo npm install`
4. Run `npm install -g @aws-amplify/cli`
5. Run `amplify pull`, configure as follow:

```
~/Workspace/world-exploration/client-react master*
❯ amplify pull
? Default region name: us-east-2
? Default output format: -leave empty-

For more information on AWS Profiles, see:
https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html

? Do you want to use an AWS profile? Yes
? Please choose the profile you want to use default
? Which app are you working on? drhc45wgxccf2
Backend environment 'dev' found. Initializing...
? Choose your default editor: Visual Studio Code
? Choose the type of app that you're building javascript
Please tell us about your project
? What javascript framework are you using react
? Source Directory Path:  src
? Distribution Directory Path: build
? Build Command:  npm run-script build
? Start Command: npm run-script start

? Do you plan on modifying this backend? No

Added backend environment config object to your project.
Run 'amplify pull' to sync upstream changes.

```

## Available Scripts

In the project directory, you can run:

### `npm install`

Installs all neccessary components for the app

### Remember before you can run it, you must copy .env file from the group and past it into the root folder

This file contains the API key for Google Maps, without it the maps won't have a key to run, we don't commit this file for security reasons.

### `npm run-script start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
