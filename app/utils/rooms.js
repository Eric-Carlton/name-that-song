/**
 * Created by ericcarlton on 4/14/16.
 */
"use strict";

const mongo = require('mongodb').MongoClient;
const users = require('./users');
const privateProperties = require('../config/privateProperties');
const appProperties = require('../config/appProperties');
var ObjectId = require('mongodb').ObjectID;
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

        delete host.email;

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

function deleteRoom(db, room) {
    log.trace({roomId: room._id}, 'Entered rooms.deleteRoom');

    const collection = db.collection('rooms');

    return new Promise((resolve, reject) => {
        collection.deleteOne({_id: room._id}).then((result) => {
            log.trace({result: result, roomId: room._id}, 'Room deleted, resolving from rooms.deleteRoom');
            resolve();
        }, (err) => {
            log.error({
                error: err,
                roomId: room._id
            }, 'Error while deleting room, rejecting from rooms.updateRoomUsers');
            reject({
                error: {
                    code: 1006,
                    message: appProperties.errorMessages['1006']
                }
            });
        });
    });
}

function updateRoom(db, room) {
    log.trace({roomId: room._id}, 'Entered rooms.updateRoom');

    const collection = db.collection('rooms');

    return new Promise((resolve, reject) => {
        collection.updateOne({_id: room._id}, room).then((result) => {
            log.trace({result: result, roomId: room._id}, 'Resolving from rooms.updateRoom');
            resolve();
        }, (err) => {
            log.error({
                error: err,
                roomId: room._id
            }, 'Error while updating users for room, rejecting from rooms.updateRoom');
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

    return new Promise((resolve, reject) => {
        getRoom(db, {roomName: roomName}).then((room) => {
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
    log.trace({id: id}, 'Entered rooms.getRoomById');

    return new Promise((resolve, reject) => {
        if (ObjectId.isValid(id)) {
            getRoom(db, {_id: id}).then((room) => {
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
        } else {
            log.trace({id: id}, 'Id is not a valid ObjectId, resolving from rooms.getRoomById with null');
            resolve(null);
        }
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
                        log.trace("Made it here");
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

    joinRoom: (ownerName, userId) => {
        log.trace({roomName: ownerName}, 'Entered rooms.joinRoom');

        return new Promise((resolve, reject) => {
            users.getUser(userId).then((user) => {
                if (user) {
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

                                    let isUserInRoom = false;
                                    for (let userIdx = 0; userIdx < room.users.length; userIdx++) {
                                        let userInRoom = room.users[userIdx];

                                        if (user.username === userInRoom.username) {
                                            isUserInRoom = true;
                                            break;
                                        }
                                    }

                                    if (isUserInRoom) {
                                        db.close();

                                        log.trace({
                                            roomName: ownerName,
                                            user: user.username
                                        }, 'User already in room, resolving from rooms.joinRoom');

                                        delete room.playlist;

                                        resolve(room);
                                    } else {
                                        room.users.push({
                                            _id: user._id,
                                            username: user.username,
                                            score: 0,
                                            isHost: false
                                        });

                                        log.trace({users: room.users}, 'Room users changed');

                                        updateRoom(db, room).then(() => {
                                            getRoomByName(db, ownerName).then((room) => {
                                                db.close();

                                                delete room.playlist;

                                                log.trace({
                                                    roomName: ownerName,
                                                    user: user
                                                }, 'User added to room, resolving from rooms.joinRoom');
                                                resolve(room);
                                            });
                                        }, (err) => {
                                            db.close();

                                            log.trace({
                                                error: err,
                                                roomName: ownerName,
                                                user: user
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
                        userId: userId._id
                    }, 'User does not exist, rejecting from rooms.joinRoom');
                    reject(err);
                }
            }, (err) => {
                log.trace({
                    roomName: ownerName,
                    userId: userId._id
                }, 'Error searching for user, rejecting from rooms.joinRoom');
                reject(err);
            });
        });
    },

    leaveRoom: (ownerName, userId) => {
        log.trace({roomName: ownerName}, 'Entered rooms.joinRoom');

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
                    getRoomByName(db, ownerName).then((room) => {
                        if (room) {
                            //determine if the host is leaving
                            let isHostLeaving = false;
                            //build a new users array with the users that are not leaving
                            let users = [];
                            for (let userIdx = 0; userIdx < room.users.length; userIdx++) {
                                let userInRoom = room.users[userIdx];

                                if (userInRoom._id.equals(new ObjectId(userId))) {
                                    isHostLeaving = userInRoom.isHost;
                                } else {
                                    users.push(userInRoom);
                                }
                            }

                            log.trace({users: users, userId: userId}, "User with userId removed");
                            room.users = users;

                            if (isHostLeaving) {
                                deleteRoom(db, room).then(() => {
                                    getRoomByName(db, ownerName).then((room) => {
                                        db.close();

                                        log.trace({roomName: ownerName}, 'Resolving from rooms.leaveRoom');
                                        resolve(room);
                                    }, (err) => {
                                        db.close();

                                        log.trace({roomName: ownerName}, 'Error querying for room after delete, rejecting from rooms.leaveRoom');
                                        reject(err);
                                    });
                                }, (err) => {
                                    db.close();

                                    log.trace({roomName: ownerName}, 'Error updating room users, rejecting from rooms.leaveRoom');
                                    reject(err);
                                });
                            } else {
                                updateRoom(db, room).then(() => {
                                    getRoomByName(db, ownerName).then((room) => {
                                        db.close();

                                        delete room.playlist;

                                        log.trace({roomName: ownerName}, 'Resolving from rooms.leaveRoom');
                                        resolve(room);
                                    }, (err) => {
                                        db.close();

                                        log.trace({roomName: ownerName}, 'Error querying for room after removing user, rejecting from rooms.leaveRoom');
                                        reject(err);
                                    });
                                }, (err) => {
                                    db.close();

                                    log.trace({roomName: ownerName}, 'Error updating room users, rejecting from rooms.leaveRoom');
                                    reject(err);
                                });
                            }
                        } else {
                            db.close();

                            log.error({roomName: ownerName}, 'Room does not exist, rejecting from rooms.leaveRoom');
                            reject({
                                error: {
                                    code: '1022',
                                    message: appProperties.errorMessages['1022']
                                }
                            });
                        }
                    }, (err) => {
                        db.close();

                        log.trace({roomName: ownerName}, 'Error querying for room, rejecting from rooms.leaveRoom');
                        reject(err);
                    });
                }
            });
        });
    }
};