/**
 * Created by ericcarlton on 4/28/16.
 */
"use strict";

const bunyan = require('bunyan');
const appProperties = require('../config/appProperties');
const gameController = require('../controllers/gameController');

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
        server.get('/api/song/random', (req, res, next) => {
            log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'request to /api/song/random');

            //playlist not yet generated, send 404
            if (gameController.getAllSongsLength() <= 0) {
                const response = {
                    error: {
                        code: 1001,
                        message: appProperties.errorMessages['1001']
                    }
                };

                log.error('No playlist generated');
                log.debug({response: response}, 'Sending response from /api/song/random');

                res.send(500, response);
                return next();
            }
            else {
                gameController.getRandomSong().then((previewUrl) => {
                    const response = {
                        url: previewUrl,
                        playlistLength: gameController.getAllSongsLength(),
                        songsLeft: gameController.getAllSongsLength() - gameController.getPickedSongsLength()
                    };

                    log.debug({response: response}, 'Sending response from /api/song/random');

                    res.send(200, response);
                    return next();
                }, () => {
                    const response = {
                        error: {
                            code: '1003',
                            message: appProperties.errorMessages['1003']
                        },
                        playlistLength: gameController.getAllSongsLength(),
                        songsLeft: gameController.getAllSongsLength() - gameController.getPickedSongsLength()
                    };

                    log.debug({response}, 'Sending response from /api/song/random');

                    res.send(500, response);
                    return next();
                });
            }
        });

        //TODO: title matcher logic
        server.post('/api/song/guess', (req, res, next) => {
            log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'request to /api/song/guess');

            const response = {correct: true, score: 1};

            log.debug({response: response}, 'Sending response from /api/song/guess');
            res.send(200, response);

            return next();
        });
    }
};