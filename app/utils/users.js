/**
 * Created by ericcarlton on 2/13/16.
 */
'use strict';

const mongo = require('mongodb').MongoClient;
const privateProperties = require('../config/privateProperties');
const appProperties = require('../config/appProperties');
const bunyan = require('bunyan');
const crypto = require('crypto');

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

function insertUser(db, username, password) {
    log.trace({username: username}, 'Entered users.insertUser');

    const salt = new Date().getTime() + crypto.randomBytes(256).toString('hex');
    let sha512 = crypto.createHash('sha512');

    password = sha512.update(salt + password, 'utf8').digest('hex');

    return new Promise((resolve, reject) => {
        const collection = db.collection('users');

        collection.insertOne({username: username, password: password, salt: salt}, (err, result) => {
            if (err) {
                log.trace({
                    error: err,
                    username: username
                }, 'Error while creating user, rejecting from users.insertUser');
                reject({
                    error: {
                        code: 1006,
                        message: appProperties.errorMessages['1006']
                    }
                });
            } else {
                log.trace({
                    username: username,
                    result: result
                }, 'Created user successfully, resolving from users.insertUser');
                resolve(result);
            }
        });
    });
}

function isUsernameUnique(db, username) {
    log.trace({username: username}, 'Entered users.isUsernameUnique');

    return new Promise((resolve, reject) => {
        const collection = db.collection('users');

        collection.find({username: username}).toArray((err, docs) => {
            if (err) {
                log.trace({
                    error: err,
                    username: username
                }, 'Error while checking username uniqueness, rejecting from users.isUsernameUnique');
                reject({
                    error: {
                        code: 1006,
                        message: appProperties.errorMessages['1006']
                    }
                });
            } else if (docs.length > 0) {
                log.trace({username: username}, 'Username already registered, rejecting from users.isUsernameUnique');
                reject({
                    error: {
                        code: 1007,
                        message: appProperties.errorMessages['1007']
                    }
                });
            } else {
                log.trace({username: username}, 'Username unique, resolving from users.isUsernameUnique');
                resolve();
            }
        });
    });
}

function findUser(db, username, password) {
    log.trace({username: username}, 'Entered users.findUser');

    return new Promise((resolve, reject) => {
        const collection = db.collection('users');
        let sha512 = crypto.createHash('sha512');

        collection.find({username: username}).limit(1).next((err, doc) => {
            if (err) {
                log.trace({
                    error: err,
                    username: username
                }, 'Error while logging user in, rejecting from users.findUser');
                reject({
                    error: {
                        code: 1006,
                        message: appProperties.errorMessages['1006']
                    }
                });
            } else {
                if (doc) {
                    if (doc.hasOwnProperty('password') && doc.hasOwnProperty('salt') &&
                        doc.password === sha512.update(doc.salt + password, 'utf8').digest('hex')) {

                        log.trace({username: username}, 'Username/password combination found, resolving from users.findUser');
                        resolve({
                            user: {
                                id: doc._id
                            }
                        });
                    } else {
                        log.trace({username: username}, 'Password incorrect for username, rejecting from users.findUser');
                        reject({
                            error: {
                                code: 1009,
                                message: appProperties.errorMessages['1009']
                            }
                        });
                    }
                } else {
                    log.trace({username: username}, 'Username not found, rejecting from users.findUser');
                    reject({
                        error: {
                            code: 1008,
                            message: appProperties.errorMessages['1008']
                        }
                    });
                }
            }
        });
    });
}


module.exports = {

    createUser: (username, password) => {
        log.trace({username: username}, 'Entered users.createUser');

        return new Promise((resolve, reject) => {
            mongo.connect(privateProperties.mongoUrl, (err, db) => {
                if (err) {
                    log.error({error: err}, 'Error with db connection, rejecting from users.createUser');
                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                } else {
                    isUsernameUnique(db, username).then(() => {
                        insertUser(db, username, password).then((result) => {
                            db.close();
                            log.trace({
                                username: username,
                                result: result
                            }, 'Created user successfully, resolving from users.createUser');
                            resolve(result);
                        }, (err) => {
                            db.close();
                            log.trace({
                                error: err,
                                username: username
                            }, 'Error while creating user, rejecting from users.createUser');
                            reject(err);
                        });
                    }, (err) => {
                        db.close();
                        log.trace({username: username}, 'Username already registered, rejecting from users.createUser');
                        reject(err);
                    });
                }
            });
        });
    },

    loginUser: (username, password) => {
        return new Promise((resolve, reject) => {
            mongo.connect(privateProperties.mongoUrl, (err, db) => {
                if (err) {
                    log.error({error: err}, 'Error with db connection, rejecting from users.loginUser');
                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                } else {
                    findUser(db, username, password).then((user) => {
                        db.close();

                        log.trace({username: username}, 'Username/password combination found, resolving from users.loginUser');
                        resolve(user);
                    }, (err) => {
                        db.close();

                        log.trace({username: username}, 'Username/password combination not found, rejecting from users.loginUser');
                        reject(err);
                    });
                }
            });
        });
    }

};