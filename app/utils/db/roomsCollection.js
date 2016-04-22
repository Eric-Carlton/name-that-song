/**
 * Created by ericcarlton on 4/21/16.
 */
"use strict";

const mongo = require('mongodb').MongoClient;
const privateProperties = require('../../config/privateProperties');
const appProperties = require('../../config/appProperties');
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

function connectToDb() {
    log.trace('Entered roomsCollection.connectToDb');

    return new Promise((resolve, reject) => {
        mongo.connect(privateProperties.mongoUrl).then((db) => {
            log.trace('Connection to DB successful, resolving from roomsCollection.connectToDb');
            resolve({collection: db.collection('rooms'), db: db});
        }, (err) => {
            log.error({error: err}, 'Error with DB connection, rejecting from roomsCollection.connectToDb');
            reject({
                error: {
                    code: 1006,
                    message: appProperties.errorMessages['1006']
                }
            });
        });
    });
}

module.exports = {
    insertRoom: (room) => {
        log.trace({roomName: room.roomName}, 'Entered roomsCollection.insertRoom');

        return new Promise((resolve, reject) => {
            connectToDb().then((connection) => {
                connection.collection.insertOne(room).then((result) => {
                    log.trace({roomName: room.roomName, result: result}, 'Room inserted');
                    connection.collection.find({roomName: room.roomName}).limit(1).next().then((room) => {
                        connection.db.close();

                        log.trace({roomName: room.roomName}, 'Room retrieved after insertion, resolving from roomsCollection.insertRoom');
                        resolve(room);
                    }, (err) => {
                        connection.db.close();

                        log.error({
                            roomName: room.roomName,
                            error: err
                        }, 'Error retrieving room after insertion, rejecting from roomsCollection.insertRoom');
                        reject({
                            error: {
                                code: 1006,
                                message: appProperties.errorMessages['1006']
                            }
                        });
                    });
                }, (err) => {
                    connection.db.close();

                    log.error({
                        roomName: room.roomName,
                        error: err
                    }, 'Error inserting room, rejecting from roomsCollection.insertRoom');
                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                });
            }, (err) => {
                log.trace({
                    roomName: room.roomName,
                    error: err
                }, 'Error connecting to DB, rejecting from roomsCollection.insertRoom');
                reject(err);
            });
        });
    },

    getRoom: (query) => {
        log.trace({query: query}, 'Entered roomsCollection.getRoom');

        return new Promise((resolve, reject) => {
            connectToDb().then((connection) => {
                connection.collection.find(query).limit(1).next().then((room) => {
                    connection.db.close();
                    if (room) {
                        log.trace({roomName: room.roomName}, 'Room found, resolving from roomsCollection.getRoom');
                    } else {
                        log.trace({query: query}, 'Room not found, resolving from roomsCollection.getRoom with null');
                    }

                    resolve(room);
                }, (err) => {
                    connection.db.close();
                    log.error({
                        error: err,
                        query: query
                    }, 'Error while searching for room, rejecting from roomsCollection.getRoom');
                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                });
            }, (err) => {
                log.trace({
                    query: query,
                    error: err
                }, 'Error connecting to DB, rejecting from roomsCollection.getRoom');
                reject(err);
            });
        });
    },

    updateRoom: (room) => {
        log.trace({id: room._id}, 'Entered roomsCollection.updateRoom');

        return new Promise((resolve, reject) => {
            connectToDb().then((connection) => {
                connection.collection.updateOne({_id: room._id}, room).then((result) => {
                    log.trace({result: result, roomId: room._id}, 'Room updated');
                    connection.collection.find({_id: room._id}).limit(1).next().then((room) => {
                        connection.db.close();

                        log.trace({
                            result: result,
                            roomId: room._id
                        }, 'Room retrieved after update, resolving from roomsCollection.updateRoom');
                        resolve(room);
                    }, (err) => {
                        connection.db.close();

                        log.error({
                            roomName: room.roomName,
                            error: err
                        }, 'Error retrieving room after update, rejecting from roomsCollection.updateRoom');
                        reject({
                            error: {
                                code: 1006,
                                message: appProperties.errorMessages['1006']
                            }
                        });
                    });
                }, (err) => {
                    connection.db.close();

                    log.error({
                        error: err,
                        roomId: room._id
                    }, 'Error while updating users for room, rejecting from roomsCollection.updateRoom');
                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                });
            }, (err) => {
                log.trace({
                    id: room._id,
                    error: err
                }, 'Error connecting to DB, rejecting from roomsCollection.updateRoom');
                reject(err);
            });
        });
    },

    deleteRoom: (room) => {
        log.trace({id: room._id}, 'Entered roomsCollection.deleteRoom');

        return new Promise((resolve, reject) => {
            connectToDb().then((connection) => {
                connection.collection.deleteOne({_id: room._id}).then((result) => {
                    log.trace({result: result, roomId: room._id}, 'Room deleted');
                    connection.collection.find({_id: room._id}).limit(1).next().then((deletedRoom) => {
                        connection.db.close();

                        log.trace({
                            roomId: room._id,
                            room: deletedRoom
                        }, 'Room retrieved after delete, resolving from roomsCollection.deleteRoom');
                        resolve(deletedRoom);
                    }, (err) => {
                        connection.db.close();

                        log.error({
                            roomName: room.roomName,
                            error: err
                        }, 'Error retrieving room after delete, rejecting from roomsCollection.deleteRoom');
                        reject({
                            error: {
                                code: 1006,
                                message: appProperties.errorMessages['1006']
                            }
                        });
                    });
                }, (err) => {
                    connection.db.close();

                    log.error({
                        error: err,
                        roomId: room._id
                    }, 'Error while deleting room, rejecting from roomsCollection.deleteRoom');
                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                });
            }, (err) => {
                log.trace({
                    id: room._id,
                    error: err
                }, 'Error connecting to DB, rejecting from roomsCollection.deleteRoom');
                reject(err);
            });
        });
    }
};