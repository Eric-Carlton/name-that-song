/**
 * Created by ericcarlton on 2/13/16.
 */
'use strict';

const Collection = require('./collection');
const users = new Collection('users');
const appProperties = require('../config/appProperties');
const bunyan = require('bunyan');
const crypto = require('crypto');
var ObjectId = require('mongodb').ObjectID;

const log = bunyan.createLogger({
    name: 'name-that-song',
    streams: [
        {
            level: appProperties.stdErrLvl,
            stream: process.stdout
        },
        {
            type: 'rotating-file',
            path: 'log/name-that-song-trace.log',
            level: 'trace',
            period: '1d',
            count: 7
        }
    ]
});

/**
 * Attempts to retrieve a user from the db by username. Returns a promise that resolves with the user retrieved.
 * @param username      -   The value of the username property of the user to search for.
 * @returns {Promise}   -   If the operation was a success, resolves with the user found ( even if that value is null ).
 *                          Otherwise, rejects with an error.
 */
function getUserByUsername(username) {
    log.trace({username: username}, 'Entered users.getUserByUsername');

    return new Promise((resolve, reject) => {
        users.getDocument({username: username.toLowerCase()}).then((user) => {
            if (user) {
                log.trace({username: user.username}, 'User found, resolving from users.getUserByUsername');
            } else {
                log.trace({username: username}, 'User not found, resolving from users.getUserByUsername with null');
            }

            resolve(user);
        }, (err) => {
            log.trace({
                error: err,
                username: username
            }, 'Error while searching for user by username, rejecting from users.getUserByUsername');

            reject(err);
        });
    });
}

/**
 * Attempts to retrieve a user from the db by email. Returns a promise that resolves with the user retrieved.
 * @param email      -   The value of the email property of the user to search for.
 * @returns {Promise}   -   If the operation was a success, resolves with the user found ( even if that value is null ).
 *                          Otherwise, rejects with an error.
 */
function getUserByEmail(email) {
    log.trace({email: email}, 'Entered users.getUserByEmail');

    return new Promise((resolve, reject) => {
        users.getDocument({email: email.toLowerCase()}).then((user) => {
            if (user) {
                log.trace({username: user.username}, 'User found, resolving from users.getUserByEmail');
            } else {
                log.trace({email: email}, 'User not found, resolving from users.getUserByEmail with null');
            }

            resolve(user);
        }, (err) => {
            log.trace({
                error: err,
                email: email
            }, 'Error while searching for user by email, rejecting from users.getUserByEmail');

            reject(err);
        });
    });
}

/**
 * Attempts to retrieve a user from the db by _id. Returns a promise that resolves with the user retrieved.
 * @param id            -   The value of the _id property of the user to search for.
 * @returns {Promise}   -   If the operation was a success, resolves with the user found ( even if that value is null ).
 *                          Otherwise, rejects with an error.
 */
function getUserById(id) {
    log.trace({userId: id}, 'Entered users.getUserById');

    return new Promise((resolve, reject) => {
        //if the id passed can be converted to an ObjectId, try to get a room with that _id value
        if (ObjectId.isValid(id)) {
            users.getDocument({_id: new ObjectId(id)}).then((user) => {
                if (user) {
                    log.trace({userId: user._id}, 'User found, resolving from users.getUserById');
                } else {
                    log.trace({userId: id}, 'User not found, resolving from users.getUserById with null');
                }

                resolve(user);
            }, (err) => {
                log.trace({
                    error: err,
                    userId: id
                }, 'Error while searching for user by id, rejecting from users.getUserById');

                reject(err);
            });
        } else {
            log.trace({userId: id}, 'Id is not a valid ObjectId, resolving from users.getUserById with null');

            resolve(null);
        }
    });
}

/**
 * Determines if a user has been registered with the given username.
 * Returns a promise that resolves with true if the username is unique and false otherwise.
 * @param username      -   The username to determine uniqueness for.
 * @returns {Promise}   -   If the operation was a success, resolves with true if the username is unique and false otherwise.
 *                          If the operation failed, rejects with an error.
 */
function isUsernameUnique(username) {
    log.trace({username: username}, 'Entered users.isUsernameUnique');

    return new Promise((resolve, reject) => {
        getUserByUsername(username).then((user) => {
            if (user) {
                log.trace({username: username}, 'Username already registered, resolving from users.isUsernameUnique');

                resolve(false);
            } else {
                log.trace({username: username}, 'Username unique, resolving from users.isUsernameUnique');

                resolve(true);
            }
        }, (err) => {
            log.trace({
                error: err,
                username: username
            }, 'Error while checking username uniqueness, rejecting from users.isUsernameUnique');

            reject(err);
        });
    });
}

/**
 * Determines if a user has been registered with the given email address.
 * Returns a promise that resolves with true if the email address is unique and false otherwise.
 * @param email         -   The email address to determine uniqueness for.
 * @returns {Promise}   -   If the operation was a success, resolves with true if the email address is unique and false otherwise.
 *                          If the operation failed, rejects with an error.
 */
function isEmailUnique(email) {
    log.trace({email: email}, 'Entered users.isEmailUnique');

    return new Promise((resolve, reject) => {
        getUserByEmail(email).then((user) => {
            if (user) {
                log.trace({email: email}, 'Email already registered, resolving from users.isEmailUnique');
                resolve(false);
            } else {
                log.trace({email: email}, 'Email unique, resolving from users.isEmailUnique');
                resolve(true);
            }
        }, (err) => {
            log.trace({
                error: err,
                email: email
            }, 'Error while checking email uniqueness, rejecting from users.isEmailUnique');
            reject(err);
        });
    });
}

/**
 * Determines if a user exists in the database with the combination of credentials given.  Returns a promise that resolves
 * with the document from the database with the matching credentials, if one is found, and an error, if one applies.
 * @param username      -   The username to verify.
 * @param password      -   The password to verify.
 * @returns {Promise}   -   If the operation was successful and a match was found for the credentials given,
 *                          resolves with an object having an error property containing null and a user property
 *                          containing the document with the given credentials.
 *                          If the operation successful but no match was found for the credentials given,
 *                          resolves with an object having an error property containing an error message and a user
 *                          property containing null.
 *                          If the operation was not successful, rejects with an error.
 */
function verifyLogin(username, password) {
    log.trace({username: username}, 'Entered users.verifyLogin');

    return new Promise((resolve, reject) => {
        getUserByUsername(username).then((user) => {
            if (user) {
                if (user.hasOwnProperty('password') && user.hasOwnProperty('salt') &&
                    user.password === crypto.createHash('sha512').update(user.salt + password, 'utf8').digest('hex')) {
                    log.trace({username: username}, 'Username/password combination found, resolving from users.verifyLogin');
                    resolve({user: user, error: null});
                } else {
                    log.trace({username: username}, 'Password incorrect for username, resolving from users.verifyLogin with error');
                    resolve({
                        user: null,
                        error: {
                            code: 1009,
                            message: appProperties.errorMessages['1009']
                        }
                    });
                }
            } else {
                log.trace({username: username}, 'Username not found, resolving from users.verifyLogin with error');
                reject({
                    user: null,
                    error: {
                        code: 1008,
                        message: appProperties.errorMessages['1008']
                    }
                });
            }
        }, (err) => {
            log.trace({
                error: err,
                username: username
            }, 'Error while logging user in, rejecting from users.verifyLogin');
            reject(err);
        });
    });
}

/**
 * Generates a salt and sha512 hash for the username and password provided.
 * @param username                  -   The username of the user to generate a password hash for.
 * @param password                  -   The password of the user to generate a password hash for.
 * @returns {{salt: *, hash: *}}    -   The salt property is the salt used to create the password hash.
 *                                      The hash property is the result of salting and hashing for the username and
 *                                      password given.
 */
function generatePasswordHashForUsername(username, password) {
    log.trace({username: username}, 'Entered users.generatePasswordHashForUsername');

    const salt = new Date().getTime() + crypto.randomBytes(8).toString('hex');
    const hash = crypto.createHash('sha512').update(salt + password, 'utf8').digest('hex');

    log.trace({username: username}, 'Password hash has been generated, exiting users.generatePasswordHashForUsername');
    return {
        salt: salt,
        hash: hash
    };
}


module.exports = {
    createUser: (username, password, email) => {
        log.trace({username: username}, 'Entered users.createUser');

        return new Promise((resolve, reject) => {
            isUsernameUnique(username).then((isUsernameUnique) => {
                if (isUsernameUnique) {
                    const hashedPassword = generatePasswordHashForUsername(username, password);

                    if (email && email.length > 0) {
                        isEmailUnique(email).then((isEmailUnique) => {
                            if (isEmailUnique) {
                                users.insertDocument({
                                    username: username.toLowerCase(),
                                    password: hashedPassword.hash,
                                    email: email.toLowerCase(),
                                    salt: hashedPassword.salt
                                }, {username: username.toLowerCase()}).then((result) => {
                                    if (result) {
                                        //want to return the entire user except the password and salt
                                        delete result.salt;
                                        delete result.password;
                                    }

                                    log.trace({
                                        username: username,
                                        result: result
                                    }, 'Created user successfully, resolving from users.createUser');
                                    resolve(result);
                                }, (err) => {

                                    log.trace({
                                        error: err,
                                        username: username
                                    }, 'Error while creating user, rejecting from users.createUser');
                                    reject(err);
                                });
                            } else {
                                log.trace({username: username}, 'Email is not unique, resolving from users.createUser with error');

                                resolve({
                                    error: {
                                        code: 1014,
                                        message: appProperties.errorMessages['1014']
                                    }
                                });
                            }

                        }, (err) => {
                            log.trace({username: username}, 'Error occurred when checking for email uniqueness, rejecting from users.createUser');
                            reject(err);
                        });
                    } else {
                        users.insertDocument({
                            username: username.toLowerCase(),
                            password: hashedPassword.hash,
                            email: null,
                            salt: hashedPassword.salt
                        }, {username: username.toLowerCase()}).then((result) => {
                            if (result) {
                                //want to return the entire user except the password and salt
                                delete result.salt;
                                delete result.password;
                            }

                            log.trace({
                                username: username,
                                result: result
                            }, 'Created user successfully, resolving from users.createUser');
                            resolve(result);
                        }, (err) => {

                            log.trace({
                                error: err,
                                username: username
                            }, 'Error while creating user, rejecting from users.createUser');
                            reject(err);
                        });
                    }
                } else {
                    log.trace({username: username}, 'Username is not unique, resolving from users.createUser with error');

                    resolve({
                        error: {
                            code: 1007,
                            message: appProperties.errorMessages['1007']
                        }
                    });
                }
            }, (err) => {
                log.trace({username: username}, 'Error occurred when checking for username uniqueness, rejecting from users.createUser');
                reject(err);
            });
        });
    },

    checkUsernameAvailable: (username) => {
        return new Promise((resolve, reject) => {
            isUsernameUnique(username).then((isUnique) => {
                if (isUnique) {
                    log.trace({username: username}, 'Username available, resolving from users.checkUsernameAvailable');
                } else {
                    log.trace({username: username}, 'Username not available, resolving from users.checkUsernameAvailable');
                }

                resolve(isUnique);
            }, (err) => {
                log.trace({username: username}, 'An error occurred while checking username availability, rejecting from users.checkUsernameAvailable');
                reject(err);
            });
        });
    },

    loginUser: (username, password) => {
        return new Promise((resolve, reject) => {
            verifyLogin(username, password).then((result) => {
                if (result.error) {
                    log.trace({username: username}, 'Username/password combination not found, resolving from users.loginUser');
                } else {
                    log.trace({username: username}, 'Username/password combination found, resolving from users.loginUser');

                    //want to return the entire user except the password and salt
                    delete result.user.password;
                    delete result.user.salt;
                }

                resolve(result);
            }, (err) => {
                log.trace({username: username}, 'Error occurred while retrieving user, rejecting from users.loginUser');
                reject(err);
            });
        });
    },

    getUser: (id) => {
        log.trace({userId: id}, 'Entered users.getUser');

        return new Promise((resolve, reject) => {
            getUserById(id).then((user) => {
                if (user) {
                    delete user.password;
                    delete user.salt;

                    log.trace({userId: id}, 'User found, resolving from users.getUser');
                    resolve(user);
                } else {
                    log.trace({userId: id}, 'User not found, resolving from users.getUser with null');
                    resolve(null);
                }
            }, (err) => {
                log.trace({userId: id}, 'Error querying for user, rejecting from users.getUser');
                reject(err);
            });
        });
    }
};