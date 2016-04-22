/**
 * Created by ericcarlton on 4/14/16.
 */
"use strict";

const users = require('./users');
const roomsCollection = require('./db/roomsCollection');
const appProperties = require('../config/appProperties');
const ObjectId = require('mongodb').ObjectID;
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

function getRoomByName(roomName) {
    log.trace({roomName: roomName}, 'Entered rooms.getRoomByName');

    return new Promise((resolve, reject) => {
        roomsCollection.getRoom({roomName: roomName}).then((room) => {
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

function getRoomById(id) {
    log.trace({id: id}, 'Entered rooms.getRoomById');

    return new Promise((resolve, reject) => {
        if (ObjectId.isValid(id)) {
            roomsCollection.getRoom({_id: id}).then((room) => {
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

function getRoomByNameOrId(identifier) {
    log.trace({identifier: identifier}, 'Entered rooms.getRoomByNameOrId');

    return new Promise((resolve, reject) => {
        getRoomByName(identifier.toLowerCase()).then((room) => {
            if (room) {
                log.trace({identifier: identifier}, 'Room found, resolving from rooms.getRoomByNameOrId');
                resolve(room);
            } else {
                //failed to find room by roomName, try by id
                getRoomById(identifier).then((room) => {
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
            getRoomByNameOrId(identifier).then((room) => {
                if (room) {
                    log.trace({identifier: identifier}, 'Room found, resolving from rooms.retrieveRoom');

                    delete room.playlist;
                } else {
                    log.trace({identifier: identifier}, 'Room not found, resolving from rooms.retrieveRoom with null');
                }

                resolve(room);
            }, (err) => {
                log.trace({
                    error: err,
                    identifier: identifier
                }, 'Error while checking for room, rejecting from rooms.retrieveRoom');
                reject(err);
            });
        });
    },

    createRoom: (host, playlist) => {
        log.trace({roomName: host.username}, 'Entered rooms.createRoom');

        return new Promise((resolve, reject) => {
            getRoomByName(host.username.toLowerCase()).then((room) => {
                if (room) {
                    delete room.playlist;

                    log.trace({room: room}, 'Room already exists, resolving form rooms.createRoom');
                    resolve(room);
                } else {
                    //add required properties to host
                    host.score = 0;
                    host.isHost = true;

                    //remove email from host, we don't need it in the room
                    delete host.email;

                    roomsCollection.insertRoom({
                        roomName: host.username.toLowerCase(),
                        users: [host],
                        playlist: playlist
                    }).then((room) => {
                        //remove the playlist, don't want the user to be able to see that
                        delete room.playlist;

                        log.trace({room: room}, 'Room created, resolving from rooms.createRoom');
                        resolve(room);
                    }, (err) => {
                        log.trace({'error': err}, 'Error creating room, rejecting from rooms.createRoom');
                        reject(err);
                    });
                }
            }, (err) => {
                log.trace({roomName: host.username}, 'Error querying for room, rejecting from rooms.createRoom');
                reject(err);
            });
        });
    },

    joinRoom: (roomName, userId) => {
        log.trace({roomName: roomName, userId: userId}, 'Entered rooms.joinRoom');

        return new Promise((resolve, reject) => {
            users.getUser(userId).then((user) => {
                if (user) {
                    getRoomByName(roomName.toLowerCase()).then((room) => {
                        if (room) {
                            let isUserInRoom = false;
                            for (let userIdx = 0; userIdx < room.users.length; userIdx++) {
                                let userInRoom = room.users[userIdx];

                                if (user._id.equals(userInRoom._id)) {
                                    isUserInRoom = true;
                                    break;
                                }
                            }

                            if (isUserInRoom) {
                                log.trace({
                                    roomName: roomName,
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

                                roomsCollection.updateRoom(room).then((room) => {
                                    delete room.playlist;

                                    log.trace({
                                        roomName: roomName,
                                        user: user
                                    }, 'User added to room, resolving from rooms.joinRoom');
                                    resolve(room);
                                }, (err) => {
                                    log.trace({
                                        error: err,
                                        roomName: roomName,
                                        user: user
                                    }, 'Error adding user to room, rejecting from rooms.joinRoom');
                                    reject(err);
                                });
                            }
                        } else {
                            log.trace({roomName: roomName}, 'Room not found, resolving from rooms.joinRoom with null');
                            resolve(null);
                        }
                    }, (err) => {
                        log.trace({roomName: roomName}, 'Error querying for room, rejecting from rooms.joinRoom');
                        reject(err);
                    });
                } else {
                    const err = {
                        error: {
                            code: 1023,
                            message: appProperties.errorMessages['1023']
                        }
                    };

                    log.trace({
                        roomName: roomName,
                        userId: userId._id
                    }, 'User does not exist, rejecting from rooms.joinRoom');
                    reject(err);
                }
            }, (err) => {
                log.trace({
                    roomName: roomName,
                    userId: userId._id
                }, 'Error searching for user, rejecting from rooms.joinRoom');
                reject(err);
            });
        });
    },

    leaveRoom: (ownerName, userId) => {
        log.trace({roomName: ownerName}, 'Entered rooms.leaveRoom');

        return new Promise((resolve, reject) => {
            getRoomByName(ownerName).then((room) => {
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
                        roomsCollection.deleteRoom(room).then((room) => {
                            log.trace({roomName: ownerName}, 'Resolving from rooms.leaveRoom');
                            resolve(room);
                        }, (err) => {
                            log.trace({roomName: ownerName}, 'Error updating room users, rejecting from rooms.leaveRoom');
                            reject(err);
                        });
                    } else {
                        roomsCollection.updateRoom(room).then((room) => {
                            delete room.playlist;

                            log.trace({roomName: ownerName}, 'Resolving from rooms.leaveRoom');
                            resolve(room);
                        }, (err) => {
                            log.trace({roomName: ownerName}, 'Error updating room users, rejecting from rooms.leaveRoom');
                            reject(err);
                        });
                    }
                } else {
                    log.error({roomName: ownerName}, 'Room does not exist, rejecting from rooms.leaveRoom');
                    reject({
                        error: {
                            code: '1022',
                            message: appProperties.errorMessages['1022']
                        }
                    });
                }
            }, (err) => {
                log.trace({roomName: ownerName}, 'Error querying for room, rejecting from rooms.leaveRoom');
                reject(err);
            });
        });
    }
};