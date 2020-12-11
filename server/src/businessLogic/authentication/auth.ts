// import AmazonCognitoIdentity from 'amazon-cognito-identity-js';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute, CognitoRefreshToken } from 'amazon-cognito-identity-js';
import AWS from 'aws-sdk';
import request from 'request';
import jwkToPem from 'jwk-to-pem';
import jwt from 'jsonwebtoken';
import { stringType } from 'aws-sdk/clients/iam';
import fetch from "node-fetch"

export class AuthenticationSystem {

    constructor(poolID: string, clientID: string) {

        this.poolData.ClientId = clientID;
        this.poolData.UserPoolId = poolID;
        console.log('pooldata', this.poolData)
        this.userPool = new CognitoUserPool(this.poolData);
    }

    poolData = {
        UserPoolId : "", // Your user pool id here
        ClientId : "", // Your client id here
    };
    // readonly PoolRegion: "us-east-2";
    readonly AWS_ACCESS_KEY = "";
    readonly AWS_SECRET_ACCESS_KEY = "";
    readonly poolRegion = 'us-east-2';
    userPool: CognitoUserPool = null;

    setupAWS() {
        AWS.config.update({ region: this.poolRegion, credentials: new AWS.Credentials(this.AWS_ACCESS_KEY, this.AWS_SECRET_ACCESS_KEY) })
    }

    RegisterUser(data: {
        name: string,
        gender: string,
        birthdate: string,
        address: string,
        email: string,
        phoneNumber: string,
        username: string,
        password: string,
    }): Promise<unknown> {
        const attributeList: CognitoUserAttribute[] = [];
        attributeList.push(new CognitoUserAttribute({Name:"name",Value:data.name}));
        attributeList.push(new CognitoUserAttribute({Name:"gender",Value:data.gender}));
        attributeList.push(new CognitoUserAttribute({Name:"birthdate",Value:data.birthdate}));
        attributeList.push(new CognitoUserAttribute({Name:"address",Value:data.address}));
        attributeList.push(new CognitoUserAttribute({Name:"email",Value:data.email}));
        attributeList.push(new CognitoUserAttribute({Name:"phone_number",Value:data.phoneNumber}));
        attributeList.push(new CognitoUserAttribute({Name:"custom:isAdmin",Value:"0"}));

        const retVal = new Promise((resolve, reject) => {
            this.userPool.signUp(data.username, data.password, attributeList, null, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                    return;
                }
                const cognitoUser = result.user;
                console.log('user is ', cognitoUser);
                console.log('user name is ' + cognitoUser.getUsername());
                resolve(result);
            });
        });
        return retVal;

    }

    RegisterUserTemp(): Promise<unknown> {
        const attributeList: CognitoUserAttribute[] = [];
        attributeList.push(new CognitoUserAttribute({Name:"name",Value:"Minh Chad"}));
        attributeList.push(new CognitoUserAttribute({Name:"gender",Value:"male"}));
        attributeList.push(new CognitoUserAttribute({Name:"birthdate",Value:"1995-08-28"}));
        attributeList.push(new CognitoUserAttribute({Name:"address",Value:"CMB"}));
        attributeList.push(new CognitoUserAttribute({Name:"email",Value:"minhnhb96@gmail.com"}));
        attributeList.push(new CognitoUserAttribute({Name:"phone_number",Value:"+4036076594"}));
        attributeList.push(new CognitoUserAttribute({Name:"custom:isAdmin",Value:"1"}));

        const retVal = new Promise((resolve, reject) => {
            this.userPool.signUp('minhhehe', 'temppassword123', attributeList, null, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                    return;
                }
                const cognitoUser = result.user;
                console.log('user is ', cognitoUser);
                console.log('user name is ' + cognitoUser.getUsername());
                resolve(result);
            });
        });
        return retVal;

    }

    LoginUser(data: {
        username: string,
        password: string
    }): Promise<unknown> {
        const authenticationDetails = new AuthenticationDetails({
            Username : data.username,
            Password : data.password,
        });

        const userData = {
            Username : data.username,
            Pool : this.userPool
        };
        const cognitoUser = new CognitoUser(userData);
        const retVal = new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess (result) {
                    cognitoUser.getUserData((error, retrievedUserData) => {
                        if (error) {
                            console.log('error', error)
                            reject(error);
                            return;
                        } else {
                            console.log('retrievedUserData', retrievedUserData)
                            resolve( { result, userData: retrievedUserData} );
                            return;
                        }
                    });
                },
                onFailure(err) {
                    console.log(err);
                    reject(err)
                },
            });
        });
        return retVal;
    }

    LoginTempUser(): Promise<unknown> {
        const authenticationDetails = new AuthenticationDetails({
            Username : 'minhhehe',
            Password : 'temppassword123',
        });

        const userData = {
            Username : 'minhhehe',
            Pool : this.userPool
        };
        const cognitoUser = new CognitoUser(userData);
        const retVal = new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess (result) {
                    resolve(result);
                },
                onFailure(err) {
                    console.log(err);
                    reject(err)
                },
            });
        });
        return retVal;
    }

    updateUserData(data: {
        user: {
            username: string,
            password: string
        },
        userData: {
            [key: string]: string
        }
    }): Promise<unknown> {
        const attributeList: CognitoUserAttribute[] = [];
        console.log('the data', data);
        for (const property of Object.keys(data.userData)) {
            if (data.userData[property]) {
                attributeList.push(new CognitoUserAttribute({
                    Name: property,
                    Value: data.userData[property]
                }));
            }
        }
        console.log('the attribute list', attributeList);

        const userData = {
            Username: data.user.username,
            Pool: this.userPool
        };
        const authenticationDetails = new AuthenticationDetails({
            Username: data.user.username,
            Password: data.user.password,
        });

        const cognitoUser = new CognitoUser(userData);

        const retVal = new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess (result2) {
                    cognitoUser.updateAttributes(attributeList, (error, result) => {
                        if (error) {
                            reject(error);
                            return;
                        } else {
                            resolve(result);
                            return;
                        }
                    });
                },
                onFailure (err) {
                    console.log(err);
                    reject(err);
                    return;
                },
            });
        });
        return retVal;
    }

    ValidateToken(token: string): Promise<{ status: string, isValid: boolean, tokenPayLoad: any }> {
        const retVal = new Promise<{ status: string, isValid: boolean, tokenPayLoad: any }>((resolve, reject) => {
            request({
                url: `https://cognito-idp.${this.poolRegion}.amazonaws.com/${this.poolData.UserPoolId}/.well-known/jwks.json`,
                json: true
            }, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    const pems: { [id: string]: string } = {};
                    const keys = body.keys;
                    for(const key of keys) {
                        // Convert each key to PEM
                        const keyId: string = key.kid;
                        const modulus = key.n;
                        const exponent = key.e;
                        const keyType = key.kty;
                        const jwk = { kty: keyType, n: modulus, e: exponent};
                        const pemTemp = jwkToPem(jwk);
                        pems[keyId] = pemTemp;
                    }
                    // validate the token
                    const decodedJwt: any = jwt.decode(token, {complete: true});
                    if (!decodedJwt) {
                        console.log("Not a valid JWT token");
                        resolve(
                            {
                                status: "success",
                                isValid: false,
                                tokenPayLoad: {}
                            }
                        );
                        return;
                    }
                    console.log('decodedJwt', decodedJwt);
                    const kid = decodedJwt.header.kid;
                    const pem = pems[kid];
                    if (!pem) {
                        console.log('Invalid token');
                        resolve(
                            {
                                status: "success",
                                isValid: false,
                                tokenPayLoad: {}
                            }
                        );
                        return;
                    }

                    jwt.verify(token, pem, (err, payload) => {
                        if(err) {
                            console.log("Invalid Token.");
                            resolve(
                                {
                                    status: "success",
                                    isValid: false,
                                    tokenPayLoad: {}
                                }
                            );
                            return;
                        } else {
                            console.log("Valid Token.");
                            console.log(payload);
                            resolve(
                                {
                                    status: "success",
                                    isValid: true,
                                    tokenPayLoad: decodedJwt.payload
                                }
                            );
                            return;
                        }
                    });
                } else {
                    console.log("Error! Unable to download JWKs");
                    resolve(
                        {
                            status: "error",
                            isValid: false,
                            tokenPayLoad: {}
                        }
                    );
                    return;
                }
            });
        });
        return retVal;
    }

    renew(data: {
        username: string,
        refreshToken: string
    }): Promise<unknown> {
        const RefreshToken = new CognitoRefreshToken({RefreshToken: data.refreshToken});

        const userPool = new CognitoUserPool(this.poolData);

        const userData = {
            Username: data.username,
            Pool: userPool
        };

        const cognitoUser = new CognitoUser(userData);
        const retVal = new Promise((resolve, reject) => {
            cognitoUser.refreshSession(RefreshToken, (err, session) => {
                if (err) {
                    reject(err);
                    return;
                } else {
                    const retObj = {
                        "access_token": session.accessToken.jwtToken,
                        "id_token": session.idToken.jwtToken,
                        "refresh_token": session.refreshToken.token,
                    }
                    resolve(retObj);
                    return;
                }
            })
        });
        return retVal;
    }

    // TODO: Delete a user
    DeleteUser(username: string, password: string) {
        const authenticationDetails = new AuthenticationDetails({
            Username: username,
            Password: password,
        });

        const userData = {
            Username: username,
            Pool: this.userPool
        };
        const cognitoUser = new CognitoUser(userData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess (result) {
                cognitoUser.deleteUser((err, deleteResult) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Successfully deleted the user.");
                        console.log(deleteResult);
                    }
                });
            },
            onFailure (err) {
                console.log(err);
            },
        });
    }

    // TODO: Delete an attribute from user
    deleteAttributes(username: string, password: string){
        const attributeList = [];
        attributeList.push("custom:scope");
        attributeList.push("name");

        const authenticationDetails = new AuthenticationDetails({
            Username: username,
            Password: password,
        });

        const userData = {
            Username: username,
            Pool: this.userPool
        };
        const cognitoUser = new CognitoUser(userData);

        cognitoUser.deleteAttributes(attributeList, (err, result) => {
            if (err) {
                // handle error
            } else {
                console.log(result);
            }
        });
    }


    ChangePassword(data: {
        username: string,
        password: string,
        newpassword: string
    }): Promise<unknown> {
        const authenticationDetails = new AuthenticationDetails({
            Username: data.username,
            Password: data.password,
        });

        const userData = {
            Username: data.username,
            Pool: this.userPool
        };
        const cognitoUser = new CognitoUser(userData);
        const retVal = new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess (result) {
                    cognitoUser.changePassword(data.password, data.newpassword, (err, changeresult) => {
                        if (err) {
                            reject(err);
                            return;
                        } else {
                            console.log("Successfully changed password of the user.");
                            resolve(changeresult);
                            return;
                        }
                    });
                },
                onFailure (err) {
                    reject(err);
                    return;
                },
            });
        })
        return retVal;

    }

    logUserOut(
        username: string
    ): void {
        const userData = {
            Username : username,
            Pool : this.userPool
        };
        const cognitoUser = new CognitoUser(userData);
        cognitoUser.signOut();
    }

    confirmRegistration(data: { username: string, confirmationCode: string}): Promise<unknown> {
        const userData = {
            Username : data.username,
            Pool : this.userPool
        };
        const cognitoUser = new CognitoUser(userData);
        const retVal = new Promise((resolve, reject) => {
            cognitoUser.confirmRegistration(data.confirmationCode, true, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err)
                }
                console.log('result ', result);
                    resolve(result);
            });
        })
        return retVal;
    }

    confirmTempRegistration(): Promise<unknown> {
        const token = "003830";
        const userData = {
            Username : 'minhhehe',
            Pool : this.userPool
        };
        const cognitoUser = new CognitoUser(userData);
        const retVal = new Promise((resolve, reject) => {
            cognitoUser.confirmRegistration(token, true, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err)
                }
                console.log('result ', result);
                    resolve(result);
            });
        })
        return retVal;
    }

// ########################################## ADMIN FUNCTIONS TO BE USED IN ADMIN ROUTE #######################################################################
// ################# TO BE IMPLEMENTED LATER #################
    getAllUsers(data: {
        username: string
    }): Promise<unknown> {

        const userPool = new CognitoUserPool(this.poolData);

        const userData = {
            Username: data.username,
            Pool: userPool
        };

        const cognitoUser = new CognitoUser(userData);
        const retVal = new Promise((resolve, reject) => {
            this.setupAWS();
            const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
            const params = {
                UserPoolId: this.poolData.UserPoolId,
                AttributesToGet: [
                  'email',
                ],
              };
            cognitoidentityserviceprovider.listUsers(params, (err, listdata) => {
                if (err) {
                    console.log(err);
                    reject(err)
                }
                else {
                    console.log("data", listdata);
                    resolve(listdata)
                }
            })
        });
        return retVal;
    }
}

