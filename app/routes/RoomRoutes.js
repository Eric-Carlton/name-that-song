/**
 * Created by ericcarlton on 4/28/16.
 */
"use strict";

const bunyan = require('bunyan');
const appProperties = require('../config/appProperties');
const users = require('../utils/users');
const rooms = require('../utils/rooms');
const playlist = require('../utils/playlist');

const log = bunyan.createLogger({
    name: 'name-that-song',
    streams: [
        {
            level: appProperties.stdErrLvl,
            stream: process.stdout
        },
        {
            type: 'rotating-file',
            path: 'log/api-trace.log',
            level: 'trace',
            period: '1d',
            count: 7
        }
    ]
});

module.exports = {
    createRoutes: (server) => {
        server.post('/api/room', (req, res, next) => {
            log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'request to /api/room');

            if (req.params.hasOwnProperty('artist')) {
                if (req.params.hasOwnProperty('userId')) {
                    users.getUser(req.params.userId).then((user) => {
                        if (user) {
                            rooms.retrieveRoom(user.username).then((room) => {
                                if (room) {
                                    const response = {room: room};

                                    log.debug({response: response}, 'sending response from /room');

                                    res.send(200, response);
                                    return next();
                                } else {
                                    playlist.retrievePlaylistForArtist(req.params.artist).then((playlist) => {
                                        //check that playlist has been given in correct format
                                        if (playlist.hasOwnProperty('response') &&
                                            playlist.response.hasOwnProperty('songs') &&
                                            playlist.response.songs.length >= 10) {

                                            rooms.createRoom(user, playlist.response.songs).then((room) => {
                                                const response = {room: room};

                                                log.debug({response: response}, 'sending response from /room');

                                                res.send(200, response);
                                                return next();
                                            }, (err) => {
                                                log.debug({response: err}, 'Sending response from /room');

                                                res.send(500, err);
                                                return next();
                                            });
                                        } else {
                                            const response = {
                                                error: {
                                                    code: 1000,
                                                    message: appProperties.errorMessages['1000']
                                                }
                                            };

                                            log.error('No songs retrieved');
                                            log.debug({response: response}, 'sending response from /room');

                                            //no songs retrieved for artist, send 404
                                            res.send(404, response);

                                            return next();
                                        }
                                    }, () => {
                                        const response = {
                                            error: {
                                                code: 1000,
                                                message: appProperties.errorMessages['1000']
                                            }
                                        };

                                        log.debug({response: response}, 'sending response from /room');

                                        //error sent from echonest, bubble up
                                        res.send(404, response);
                                        return next();
                                    });
                                }
                            });
                        } else {
                            const response = {
                                error: {
                                    code: '1023',
                                    message: appProperties.errorMessages['1023']
                                }
                            };

                            log.debug({response: response}, 'Sending response from /room');

                            res.send(400, response);
                            return next();
                        }
                    }, (err) => {
                        log.debug({response: err}, 'Sending response from /api/room/:ownerName');

                        res.send(500, err);
                        return next();
                    });
                } else {
                    const response = {
                        error: {
                            code: '1024',
                            message: appProperties.errorMessages['1024']
                        }
                    };

                    log.debug({response: response}, 'Sending response from /room');

                    res.send(400, response);
                    return next();
                }
            } else {
                const response = {
                    error: {
                        code: '1016',
                        message: appProperties.errorMessages['1016']
                    }
                };

                log.debug({response: response}, 'Sending response from /api/room');

                res.send(400, response);
                return next();
            }
        });

        server.put('/api/room/:ownerName', (req, res, next) => {
            log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'Request to /api/room/:ownerName');

            if (req.params.hasOwnProperty('operation')) {
                if (req.params.hasOwnProperty('userId')) {
                    if (req.params.operation.toLowerCase() === 'join') {
                        rooms.joinRoom(req.params.ownerName, req.params.userId).then((room) => {
                            if (room) {
                                const response = {room: room};

                                log.debug({response: response}, 'sending response from /api/room/:ownerName');

                                res.send(200, response);
                                return next();
                            } else {
                                const response = {
                                    error: {
                                        code: '1022',
                                        message: appProperties.errorMessages['1022']
                                    }
                                };

                                log.debug({response: response}, 'Sending response from /api/room/:ownerName');

                                res.send(404, response);
                                return next();
                            }
                        }, (err) => {
                            log.debug({response: err}, 'Sending response from /api/room/:ownerName');

                            res.send(500, err);
                            return next();
                        });
                    } else if (req.params.operation.toLowerCase() === 'leave') {
                        rooms.leaveRoom(req.params.ownerName, req.params.userId).then((room) => {
                            const response = {room: room};

                            log.debug({response: response}, 'sending response from /api/room/:ownerName');

                            res.send(200, response);
                            return next();
                        }, (err) => {
                            log.debug({response: err}, 'Sending response from /api/room/:ownerName');

                            res.send(500, err);
                            return next();
                        });
                    } else {
                        const response = {
                            error: {
                                code: '1021',
                                message: appProperties.errorMessages['1021']
                            }
                        };

                        log.debug({response: response}, 'Sending response from /api/room/:ownerName');

                        res.send(400, response);
                        return next();
                    }

                } else {
                    const response = {
                        error: {
                            code: '1024',
                            message: appProperties.errorMessages['1024']
                        }
                    };

                    log.debug({response: response}, 'Sending response from /api/room/:ownerName');

                    res.send(400, response);
                    return next();
                }
            } else {
                const response = {
                    error: {
                        code: '1020',
                        message: appProperties.errorMessages['1020']
                    }
                };

                log.debug({response: response}, 'Sending response from /api/room/:ownerName');

                res.send(400, response);
                return next();
            }
        });
    }
};