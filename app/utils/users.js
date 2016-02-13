/**
 * Created by ericcarlton on 2/13/16.
 */
'use strict';

const mongo = require('mongodb').MongoClient;
const privateProperties = require('../config/privateProperties');
const appProperties = require('../config/appProperties');
const bunyan = require('bunyan');

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

function insertUser(db, username, password){
    log.trace({username: username}, 'Entered users.insertUser');

    return new Promise((resolve, reject) => {
        const collection = db.collection('users');

        collection.insertOne({username: username, password: password}, (err, result) => {
            if(err){
                log.trace({error: err, username: username}, 'Error while creating user, rejecting from users.insertUser');
                reject({
                    error: {
                        code: 1006,
                        message: appProperties.errorMessages['1006']
                    }
                });
            } else {
                log.trace({username: username, result: result}, 'Created user successfully, resolving from users.insertUser');
                resolve(result);
            }
        });
    });
}

function isUsernameUnique(db, username){
    log.trace({username: username}, 'Entered users.insertUser');

    return new Promise((resolve, reject) => {
        const collection = db.collection('users');

        collection.find({username: username}).toArray((err, docs) =>{
            if(err){
                log.trace({error: err, username: username}, 'Error while creating user, rejecting from users.isUsernameUnique');
                reject({
                    error: {
                        code: 1006,
                        message: appProperties.errorMessages['1006']
                    }
                });
            } else if (docs.length > 0){
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


module.exports = {

    createUser: (username, password) => {
        log.trace({username: username}, 'Entered users.createUser');

        return new Promise((resolve, reject) => {
            mongo.connect(privateProperties.mongoUrl, (err, db) => {
                if(err){
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
                            log.trace({username: username, result: result}, 'Created user successfully, resolving from users.createUser');
                            resolve(result);
                        }, (err) => {
                            db.close();
                            log.trace({error: err, username: username}, 'Error while creating user, rejecting from users.createUser');
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
    }

};