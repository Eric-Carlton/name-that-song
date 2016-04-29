/**
 * Created by ericcarlton on 4/14/16.
 */
"use strict";

const users = require('./users');
const Collection = require('./Collection');
const rooms = new Collection('rooms');
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

/**
 * Attempts to retrieve a room from the db by roomName. Returns a promise that resolves with the room retrieved.
 * @param roomName      -   The value of the roomName property of the room to search for.
 * @returns {Promise}   -   If the operation was a success, resolves with the room found ( even if that value is null ).
 *                          Otherwise, rejects with an error.
 */
function getRoomByName(roomName) {
    log.trace({roomName: roomName}, 'Entered rooms.getRoomByName');

    return new Promise((resolve, reject) => {
        rooms.getDocument({roomName: roomName}).then((room) => {
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

/**
 * Attempts to retrieve a room from the db by _id. Returns a promise that resolves with the room retrieved.
 * @param id            -   The value of the _id property of the room to search for.
 * @returns {Promise}   -   If the operation was a success, resolves with the room found ( even if that value is null ).
 *                          Otherwise, rejects with an error.
 */
function getRoomById(id) {
    log.trace({id: id}, 'Entered rooms.getRoomById');

    return new Promise((resolve, reject) => {
        //if the id passed can be converted to an ObjectId, try to get a room with that _id value
        if (ObjectId.isValid(id)) {
            rooms.getDocument({_id: id}).then((room) => {
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

/**
 * Attempts to retrieve a room from the db by either roomName or _id. Returns a promise that resolves with the room retrieved.
 * @param identifier    -   the roomName or _id value of the room to search for.
 * @returns {Promise}   -   If the operation was a success, resolves with the room found ( even if that value is null ).
 *                          Otherwise, rejects with an error.
 */
function getRoomByNameOrId(identifier) {
    log.trace({identifier: identifier}, 'Entered rooms.getRoomByNameOrId');

    return new Promise((resolve, reject) => {
        //attempt to get room by name
        getRoomByName(identifier.toLowerCase()).then((room) => {
            if (room) {
                log.trace({identifier: identifier}, 'Room found, resolving from rooms.getRoomByNameOrId');
                
                resolve(room);
            } else {
                //failed to find room by roomName, try by _id
                getRoomById(identifier).then((room) => {
                    if (room) {
                        log.trace({identifier: identifier}, 'Room found, resolving from rooms.getRoomByNameOrId');
                    } else {
                        log.trace({identifier: identifier}, 'Room not found, resolving from rooms.getRoomByNameOrId with null');
                    }
                    resolve(room);
                }, (err) => {
                    //error occurred while searching for room by _id
                    log.trace({
                        error: err,
                        identifier: identifier
                    }, 'Error while searching for room by id, rejecting from rooms.getRoomByNameOrId');
                    
                    reject(err);
                });
            }
        }, (err) => {
            //error occurred while searching for room by roomName
            log.trace({
                error: err,
                identifier: identifier
            }, 'Error while searching for room by roomName, rejecting from rooms.getRoomByNameOrId');
            
            reject(err);
        });
    });
}

module.exports = {
    /**
     * Attempts to retrieve a room from the db by either roomName or _id. Returns a promise that resolves with the room retrieved.
     * @param identifier    -   the roomName or _id value of the room to search for.
     * @returns {Promise}   -   If the operation was a success, resolves with the room found ( even if that value is null ).
     *                          Otherwise, rejects with an error.
     */
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

    /**
     * Attempts to create a room.
     * @param host          -   the owner of the room.  Host must have a username property as this will be the roomName of the room created.
     * @param playlist      -   the playlist associated with the room.
     * @returns {Promise}   -   If the operation was a success, resolves with the room that was created.
     *                          Otherwise, rejects with an error.
     */
    createRoom: (host, playlist) => {
        log.trace({roomName: host.username}, 'Entered rooms.createRoom');

        return new Promise((resolve, reject) => {
            //check if the room exists before creation
            getRoomByName(host.username.toLowerCase()).then((room) => {
                if (room) {
                    //players shouldn't see the playlist, delete it before resolving.
                    delete room.playlist;

                    log.trace({room: room}, 'Room already exists, resolving form rooms.createRoom');
                    
                    resolve(room);
                } else {
                    //add required properties to host
                    host.score = 0;
                    host.isHost = true;

                    //remove email from host, we don't need it in the room
                    delete host.email;

                    rooms.insertDocument({
                        roomName: host.username.toLowerCase(),
                        users: [host],
                        playlist: playlist
                    }, {roomName: host.username.toLowerCase()}).then((room) => {
                        //players shouldn't see the playlist, delete it before resolving.
                        delete room.playlist;

                        log.trace({room: room}, 'Room created, resolving from rooms.createRoom');
                        
                        resolve(room);
                    }, (err) => {
                        //error occurred creating room
                        log.trace({'error': err}, 'Error creating room, rejecting from rooms.createRoom');
                        
                        reject(err);
                    });
                }
            }, (err) => {
                //error occurred retrieving room
                log.trace({roomName: host.username}, 'Error querying for room, rejecting from rooms.createRoom');
                
                reject(err);
            });
        });
    },

    /**
     * Attempts to add a user to a room.
     * @param roomName      -   the name of the room to add a user to.
     * @param userId        -   the _id value of the user to add.
     * @returns {Promise}   -   If the operation was a success, resolves with the room that the user was added to.
     *                          Otherwise, rejects with an error.
     */
    joinRoom: (roomName, userId) => {
        log.trace({roomName: roomName, userId: userId}, 'Entered rooms.joinRoom');

        return new Promise((resolve, reject) => {
            //get the user based on the userId passed in
            users.getUser(userId).then((user) => {
                if (user) {
                    //retrieve the user based on the roomName passed in
                    getRoomByName(roomName.toLowerCase()).then((room) => {
                        if (room) {
                            //determine if user is already in the room
                            let isUserInRoom = false;
                            for (let userIdx = 0; userIdx < room.users.length; userIdx++) {
                                let userInRoom = room.users[userIdx];

                                //user found with the same _id value as the user to add
                                if (user._id.equals(userInRoom._id)) {
                                    isUserInRoom = true;
                                    break;
                                }
                            }

                            //user is already in room, no need to add
                            if (isUserInRoom) {
                                log.trace({
                                    roomName: roomName,
                                    user: user.username
                                }, 'User already in room, resolving from rooms.joinRoom');

                                //players shouldn't see the playlist, delete it before resolving
                                delete room.playlist;
                                
                                resolve(room);
                            } else {
                                //add the user to the room with a score of 0
                                room.users.push({
                                    _id: user._id,
                                    username: user.username,
                                    score: 0,
                                    isHost: false
                                });

                                rooms.updateDocument(room, {_id: room._id}).then((room) => {
                                    //players shouldn't see the playlist, delete it before resolving.
                                    delete room.playlist;

                                    log.trace({
                                        roomName: roomName,
                                        user: user
                                    }, 'User added to room, resolving from rooms.joinRoom');
                                    
                                    resolve(room);
                                }, (err) => {
                                    //error occurred while updating the room
                                    log.trace({
                                        error: err,
                                        roomName: roomName,
                                        user: user
                                    }, 'Error adding user to room, rejecting from rooms.joinRoom');
                                    
                                    reject(err);
                                });
                            }
                        } else {
                            //no room exists with that roomName, reject
                            log.trace({roomName: roomName}, 'Room not found, resolving from rooms.joinRoom with null');
                            
                            resolve(null);
                        }
                    }, (err) => {
                        //error occurred while searching for room
                        log.trace({roomName: roomName}, 'Error querying for room, rejecting from rooms.joinRoom');
                        
                        reject(err);
                    });
                } else {
                    //no user exists with that _id, reject
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
                //error occurred while searching for user
                log.trace({
                    roomName: roomName,
                    userId: userId._id
                }, 'Error searching for user, rejecting from rooms.joinRoom');
                reject(err);
            });
        });
    },

    /**
     * Attempts to remove a user from a room. If the user to remove is the host, attempts to delete the room.
     * @param roomName      -   the name of the room to remove a user from.
     * @param userId        -   the _id value of the user to remove.
     * @returns {Promise}   -   If the operation was a success, resolves with the room that the user was removed from.
     *                          Otherwise, rejects with an error.
     */
    leaveRoom: (roomName, userId) => {
        log.trace({roomName: roomName}, 'Entered rooms.leaveRoom');

        return new Promise((resolve, reject) => {
            //attempt to retrieve the room by the roomName passed in
            getRoomByName(roomName).then((room) => {
                if (room) {
                    //determine if the host is leaving
                    let isHostLeaving = false;
                    //build a new users array with the users that are not leaving
                    let users = [];
                    for (let userIdx = 0; userIdx < room.users.length; userIdx++) {
                        let userInRoom = room.users[userIdx];
                        
                        if (userInRoom._id.equals(new ObjectId(userId))) {
                            //user to remove is the host
                            isHostLeaving = userInRoom.isHost;
                            break;
                        } else {
                            users.push(userInRoom);
                        }
                    }
                    
                    room.users = users;
                    
                    if (isHostLeaving) {
                        //the host is leaving, delete the room
                        rooms.deleteDocument(room, {_id: room._id}).then((room) => {
                            log.trace({roomName: roomName}, 'Resolving from rooms.leaveRoom');
                            
                            resolve(room);
                        }, (err) => {
                            //an error occurred while deleting the room
                            log.trace({roomName: roomName}, 'Error deleting room, rejecting from rooms.leaveRoom');
                            
                            reject(err);
                        });
                    } else {
                        //the host isn't leaving, just update with the new users
                        rooms.updateDocument(room, {_id: room._id}).then((room) => {
                            //players shouldn't see the playlist, delete it before resolving
                            delete room.playlist;

                            log.trace({roomName: roomName}, 'Resolving from rooms.leaveRoom');
                            
                            resolve(room);
                        }, (err) => {
                            //an error occurred while updating room
                            log.trace({roomName: roomName}, 'Error updating room users, rejecting from rooms.leaveRoom');
                            
                            reject(err);
                        });
                    }
                } else {
                    //no room exists with that roomName, reject
                    log.error({roomName: roomName}, 'Room does not exist, rejecting from rooms.leaveRoom');
                    
                    reject({
                        error: {
                            code: '1022',
                            message: appProperties.errorMessages['1022']
                        }
                    });
                }
            }, (err) => {
                //an error occurred while retrieving room
                log.trace({roomName: roomName}, 'Error querying for room, rejecting from rooms.leaveRoom');
                
                reject(err);
            });
        });
    }
};