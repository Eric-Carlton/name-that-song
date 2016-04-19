/**
 * Created by ericcarlton on 4/14/16.
 */
"use strict";

const mongo = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
const users = require('./users');
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

function insertRoom(db, host, playlist) {
    log.trace({roomName: host.username, playlist: playlist}, 'Entered rooms.insertRoom');

    return new Promise((resolve, reject) => {
        const collection = db.collection('rooms');

        //add required properties to host
        host.score = 0;
        host.isHost = true;

        collection.insertOne({
            roomName: host.username.toLowerCase(),
            users: [host],
            playlist: playlist
        }).then(() => {
            getRoomByName(db, host.username).then((room) => {
                delete room.playlist;

                log.trace({room: room}, 'Room created, resolving from rooms.insertRoom');
                resolve(room);
            }, (err) => {
                log.error({
                    roomName: host.username,
                    error: err
                }, 'Error retrieving room after create, rejecting from rooms.insertRoom');
                reject({
                    error: {
                        code: 1006,
                        message: appProperties.errorMessages['1006']
                    }
                });
            });
        }, (err) => {
            log.error({roomName: host.username, error: err}, 'Error creating room, rejecting from rooms.insertRoom');
            reject({
                error: {
                    code: 1006,
                    message: appProperties.errorMessages['1006']
                }
            });
        });
    });
}

function updateRoomUsers(db, roomId, users) {
    const collection = db.collection('users');

    return new Promise((resolve, reject) => {
        collection.updateOne({_id: new ObjectId(roomId)}, {
            $set: {
                users: users
            }
        }).then((room) => {
            delete room.playlist;

            log.trace({roomId: roomId, room: room}, 'Resolving from rooms.updateRoomUsers');
            resolve(room);
        }, (err) => {
            log.error({
                error: err,
                roomId: roomId
            }, 'Error while updating users for room, rejecting from rooms.updateRoomUsers');
            reject({
                error: {
                    code: 1006,
                    message: appProperties.errorMessages['1006']
                }
            });
        });
    });
}

function getRoom(db, query) {
    log.trace({query: query}, 'Entered rooms.getRoom');

    return new Promise((resolve, reject) => {
        const collection = db.collection('rooms');

        collection.find(query).limit(1).next().then((room) => {
            if (room) {
                log.trace({roomName: room.roomName}, 'Room found, resolving from rooms.getRoom');
            } else {
                log.trace({query: query}, 'Room not found, resolving from rooms.getRoom with null');
            }

            resolve(room);
        }, (err) => {
            log.error({
                error: err,
                query: query
            }, 'Error while searching for room, rejecting from rooms.getRoom');
            reject({
                error: {
                    code: 1006,
                    message: appProperties.errorMessages['1006']
                }
            });
        });
    });
}

function getRoomByName(db, roomName) {
    log.trace({roomName: roomName}, 'Entered rooms.getRoomByName');

    const query = {
        roomName: roomName
    };

    return new Promise((resolve, reject) => {
        getRoom(db, query).then((room) => {
            if (room) {
                log.trace({roomName: room.roomName}, 'Room found, resolving from rooms.getRoomByName');
            } else {
                log.trace({roomName: roomName}, 'Room not found, resolving from rooms.getRoomByName with null');
            }

            resolve(room);
        }, (err) => {
            log.trace({
                error: err,
                roomName: roomName
            }, 'Error while searching for room by roomName, rejecting from rooms.getRoomByRoomName');
            reject(err);
        });
    });
}

function getRoomById(db, id) {
    const query = {
        _id: new ObjectId(id)
    };

    return new Promise((resolve, reject) => {
        getRoom(db, query).then((room) => {
            if (room) {
                log.trace({roomId: room._id}, 'Room found, resolving from rooms.getRoomById');
            } else {
                log.trace({roomId: id}, 'Room not found, resolving from rooms.getRoomById with null');
            }

            resolve(room);
        }, (err) => {
            log.trace({
                error: err,
                roomId: id
            }, 'Error while searching for room by roomName, rejecting from rooms.getRoomById');
            reject(err);
        });
    });
}

function getRoomByNameOrId(db, identifier) {
    log.trace({identifier: identifier}, 'Entered rooms.getRoomByNameOrId');

    return new Promise((resolve, reject) => {
        getRoomByName(db, identifier.toLowerCase()).then((room) => {
            if (room) {
                log.trace({identifier: identifier}, 'Room found, resolving from rooms.getRoomByNameOrId');
                resolve(room);
            } else {
                //failed to find room by roomName, try by id
                getRoomById(db, identifier).then((room) => {
                    if (room) {
                        log.trace({identifier: identifier}, 'Room found, resolving from rooms.getRoomByNameOrId');
                    } else {
                        log.trace({identifier: identifier}, 'Room not found, resolving from rooms.getRoomByNameOrId with null');
                    }
                    resolve(room);
                }, (err) => {
                    log.trace({
                        error: err,
                        identifier: identifier
                    }, 'Error while searching for room by id, rejecting from rooms.getRoomByNameOrId');
                    reject(err);
                });
            }
        }, (err) => {
            log.trace({
                error: err,
                identifier: identifier
            }, 'Error while searching for room by roomName, rejecting from rooms.getRoomByNameOrId');
            reject(err);
        });
    });
}

module.exports = {
    retrieveRoom: (identifier) => {
        log.trace({identifier: identifier}, 'Entered rooms.retrieveRoom');

        return new Promise((resolve, reject) => {
            mongo.connect(privateProperties.mongoUrl, (err, db) => {
                if (err) {
                    log.error({error: err}, 'Error with db connection, rejecting from rooms.retrieveRoom');
                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                } else {
                    getRoomByNameOrId(db, identifier).then((room) => {
                        db.close();

                        if (room) {
                            log.trace({identifier: identifier}, 'Room found, resolving from rooms.retrieveRoom');

                            delete room.playlist;
                        } else {
                            log.trace({identifier: identifier}, 'Room not found, resolving from rooms.retrieveRoom with null');
                        }

                        resolve(room);
                    }, (err) => {
                        db.close();

                        log.trace({
                            error: err,
                            identifier: identifier
                        }, 'Error while checking for room, rejecting from rooms.retrieveRoom');
                        reject(err);
                    });
                }
            });
        });
    },

    createRoom: (host, playlist) => {
        log.trace({roomName: host.username}, 'Entered rooms.createRoom');

        return new Promise((resolve, reject) => {
            mongo.connect(privateProperties.mongoUrl, (err, db) => {
                if (err) {
                    log.error({error: err}, 'Error with db connection, rejecting from rooms.createRoom');
                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                } else {
                    getRoomByName(db, host.username.toLowerCase()).then((room) => {
                        if (room) {
                            db.close();

                            delete room.playlist;

                            log.trace({room: room}, 'Room already exists, resolving form rooms.createRoom');
                            resolve(room);
                        } else {
                            insertRoom(db, host, playlist).then((room) => {
                                db.close();

                                log.trace({room: room}, 'Room created, resolving from rooms.createRoom');
                                resolve(room);
                            }, (err) => {
                                db.close();

                                log.trace({'error': err}, 'Error creating room, rejecting from rooms.createRoom');
                                reject(err);
                            });
                        }
                    }, (err) => {
                        db.close();

                        log.trace({roomName: host.username}, 'Error querying for room, rejecting from rooms.createRoom');
                        reject(err);
                    });
                }
            });
        });
    },

    joinRoom: (ownerName, user) => {
        log.trace({roomName: ownerName}, 'Entered rooms.joinRoom');

        return new Promise((resolve, reject) => {
            users.getUser(user._id).then((foundUser) => {
                if (foundUser) {
                    mongo.connect(privateProperties.mongoUrl, (err, db) => {
                        if (err) {
                            log.error({error: err}, 'Error with db connection, rejecting from rooms.joinRoom');
                            reject({
                                error: {
                                    code: 1006,
                                    message: appProperties.errorMessages['1006']
                                }
                            });
                        } else {
                            getRoomByName(db, ownerName.toLowerCase()).then((room) => {
                                if (room) {

                                    let userInRoom = false;
                                    for (let userIdx = 0; userIdx < room.users.length; userIdx++) {
                                        let roomUser = room.users[userIdx];

                                        if (user._id === roomUser._id) {
                                            userInRoom = true;
                                            break;
                                        }
                                    }

                                    if (userInRoom) {
                                        db.close();

                                        log.trace({
                                            roomName: ownerName,
                                            user: foundUser
                                        }, 'User already in room, resolving from rooms.joinRoom');

                                        delete room.playlist;

                                        resolve(room);
                                    } else {
                                        room.users.push({
                                            _id: foundUser._id,
                                            username: foundUser.username,
                                            score: 0,
                                            isHost: false
                                        });

                                        updateRoomUsers(db, room._id, room.users).then((room) => {
                                            db.close();

                                            log.trace({
                                                roomName: ownerName,
                                                user: foundUser
                                            }, 'User added to room, resolving from rooms.joinRoom');
                                            resolve(room);
                                        }, (err) => {
                                            db.close();

                                            log.trace({
                                                error: err,
                                                roomName: ownerName,
                                                user: foundUser
                                            }, 'Error adding user to room, rejecting from rooms.joinRoom');
                                            reject(err);
                                        });
                                    }
                                } else {
                                    db.close();

                                    log.trace({roomName: ownerName}, 'Room not found, resolving from rooms.joinRoom with null');
                                    resolve(null);
                                }
                            }, (err) => {
                                db.close();

                                log.trace({roomName: ownerName}, 'Error querying for room, rejecting from rooms.joinRoom');
                                reject(err);
                            });
                        }
                    });
                } else {
                    const err = {
                        error: {
                            code: 1023,
                            message: appProperties.errorMessages['1023']
                        }
                    };

                    log.trace({
                        roomName: ownerName,
                        userId: user._id
                    }, 'User does not exist, rejecting from rooms.joinRoom');
                    reject(err);
                }
            }, (err) => {
                log.trace({
                    roomName: ownerName,
                    userId: user._id
                }, 'Error searching for user, rejecting from rooms.joinRoom');
                reject(err);
            });
        });
    }
};