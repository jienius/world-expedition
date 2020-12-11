import express from 'express';
import { AuthenticationSystem } from '../../businessLogic/authentication/auth'
import bodyParser from 'body-parser';
import cors from 'cors';
import corsOptions = require("../../corsOption/cors")
import envConfig from './../../environments/environment';

const authInstance = new AuthenticationSystem(envConfig.di_loop, envConfig.id_teilc);
const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(cors())


/* GET users listing. */
router.get('/', cors(corsOptions), (req, res, next) => {
  res.send('respond with a resource');
});

router.get('/registerTempUser', async (req, res, next) => {
  try {
    const result = await authInstance.RegisterUserTemp()
    res.json(result);
  } catch (error) {
    res.json(error);
  }
});

router.get('/loginTempUser', async (req, res, next) => {
  try {
    const result = await authInstance.LoginTempUser()
    res.json(result);
  } catch (error) {
    res.json(error);
  }
});

router.get('/confirmTempRegistration', cors(corsOptions), async (req, res, next) => {
  try {
    const result = await authInstance.confirmTempRegistration()
    res.json(result);
  } catch (error) {
    res.json(error);
  }

});

router.post('/loginUser', cors(corsOptions), async (req, res, next) => {
  try {
    const input = req.body;
    const data = {
      username: input.username,
      password: input.password
    }
    const result = await authInstance.LoginUser(data)
    res.json(result);
  } catch (error) {
    res.json(error);
  }
});

router.post('/register', cors(corsOptions), async (req, res, next) => {
  try {
    const input = req.body;
    const data = {
      name: input.name,
      gender: input.gender,
      birthdate: input.birthdate,
      address: input.address,
      email: input.email,
      phoneNumber: input.phoneNumber,
      username: input.username,
      password: input.password,
    }
    const result = await authInstance.RegisterUser(data)
    res.json(result);
  } catch (error) {
    res.json(error);
  }
});

router.post('/getUserAttributes', cors(corsOptions), async (req, res, next) => {
  try {
    const input = req.body.idToken;
    if (input) {
      const result = await authInstance.ValidateToken(input);
      if (result.status === 'success' && result.isValid)
        res.json(result.tokenPayLoad);
      else
        res.status(400).json(result)
    } else {
      res.status(400).send('Token is empty')
    }

  } catch (error) {
    res.json(error);
  }
});

router.post('/validateToken', cors(corsOptions), async (req, res, next) => {
  try {
    const input = req.body.accessToken;
    if (input) {
      const result = await authInstance.ValidateToken(input);
      res.json(result);
    } else {
      res.status(400).send('Token is empty')
    }
  } catch (error) {
    res.json(error);
  }
});

router.post('/logout', cors(corsOptions), async (req, res, next) => {
  try {
    const input = req.body.username;
    if (input) {
      authInstance.logUserOut(input);
      res.send('done');
    } else {
      res.status(400).send('username is empty')
    }
  } catch (error) {
    res.json(error);
  }
});

router.post('/renewToken', cors(corsOptions), async (req, res, next) => {
  try {
    const input = req.body;
    if (!(input.username && !input.refreshToken))
      res.status(400).send('data is empty')
    const data = {
      username: input.username,
      refreshToken: input.refreshToken
    }
    if (input) {
      const result = await authInstance.renew(data);
      res.json(result);
    } else {
      res.status(400).send('username is empty')
    }
  } catch (error) {
    res.json(error);
  }
});


router.post('/getAllUsers', cors(corsOptions), async (req, res, next) => {
  try {
    const input = req.body;
    if (!(input.username && input.idToken)) {
      res.status(400).send('data is empty or missing')
      return;
    }
    const data = {
      username: input.username
    }
    // validate the token to see if user is authorized
    const tokenValidation = await authInstance.ValidateToken(input.idToken);
    let isAuthorized = false;
    if (tokenValidation.status === 'success' && tokenValidation.isValid) {
      const isCurrentUserAdmin = tokenValidation.tokenPayLoad['custom:isAdmin'] !== '1';
      const currentUserName = tokenValidation.tokenPayLoad['cognito:username'];
      const currentUserEmail = tokenValidation.tokenPayLoad.email;
      isAuthorized = (data.username === currentUserName || data.username === currentUserEmail || isCurrentUserAdmin)
    } else {
      res.status(403).send('user not authorized')
      return;
    }

    if (isAuthorized) {
      const result = await authInstance.getAllUsers(data);
      res.json(result);
    } else {
      res.status(403).send('user not authorized')
    }
  } catch (error) {
    res.json(error);
  }
});

router.post('/updateUserData', cors(corsOptions), async (req, res, next) => {
  try {
    const input = req.body;
    if (!(input.username && !input.userData))
      res.status(400).send('data is empty or missing')

    const data = {
      user: {
        username: input.username,
        password: input.password,
      },
      userData: {
        name: input.name,
        gender: input.gender,
        birthdate: input.birthdate,
        address: input.address,
        email: input.email,
        phone_number: input.phone_number,
      }
    }

    const result = await authInstance.updateUserData(data);
    res.json(result);

  } catch (error) {
    res.json(error);
  }
});

const usersRouter = router;
export = usersRouter;