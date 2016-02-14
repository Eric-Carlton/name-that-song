'use strict';
const bunyan = require('bunyan');
const restify = require('restify');
const appProperties = require('./config/appProperties');
const gameController = require('./controllers/gameController');
const playlist = require('./utils/playlist');
const users = require('./utils/users');

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

const server = restify.createServer({
    name: 'name-that-song',
    version: '0.0.1'
});

server.use(
    (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        return next();
    }
);

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.post('/name-that-song/user/create', (req, res, next) => {
    log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'Request to /user/create');

    if (req.params['username']) {
        if (req.params['password']) {
            users.createUser(req.params['username'], req.params['password'], req.params['email']).then( () =>  {
                log.debug('Sending 200 from /user/create');

                res.send(201);
                return next();
            }, (err) => {
                log.debug({response: err}, 'Sending response from /user/create');

                res.send(500, err);
                return next();
            });
        } else {
            const response = {
                error: {
                    code: 1005,
                    message: appProperties.errorMessages['1005']
                }
            };

            log.debug({response: response}, 'Sending response from /user/create');

            res.send(500, response);
            return next();
        }

    } else {
        const response = {
            error: {
                code: 1004,
                message: appProperties.errorMessages['1004']
            }
        };

        log.debug({response: response}, 'Sending response from /user/create');

        res.send(500, response);
        return next();
    }
});

server.post('/name-that-song/user/login', (req, res, next) =>{
    log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'Request to /user/login');

    if (req.params['username']) {
        if (req.params['password']) {
            users.loginUser(req.params['username'], req.params['password']).then( (user) =>  {
                log.debug({response: user}, 'Sending response from /user/login');

                res.send(200, user);
                return next();
            }, (err) => {
                log.debug({response: err}, 'Sending response from /user/login');

                res.send(500, err);
                return next();
            });
        } else {
            const response = {
                error: {
                    code: 1005,
                    message: appProperties.errorMessages['1005']
                }
            };

            log.debug({response: response}, 'Sending response from /user/login');

            res.send(400, response);
            return next();
        }

    } else {
        const response = {
            error: {
                code: 1004,
                message: appProperties.errorMessages['1004']
            }
        };

        log.debug({response: response}, 'Sending response from /user/login');

        res.send(400, response);
        return next();
    }
});

server.get('/name-that-song/user/available/:username', (req, res, next) => {
    log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'Request to /user/:name/available');

    users.checkUsernameAvailable(req.params['username']).then(() => {
        log.debug({response: 200}, 'Sending response from /user/:name/available');

        res.send(204);
        return next();
    }, (err) => {
        log.debug({response: err}, 'Sending response from /user/:name/available');

        res.send(500, err);
        return next();
    });
});

server.post('/name-that-song/user/password/reset', (req, res, next) => {
    log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'Request to /user/password/reset');

    if(req.params['identifier']){
        users.resetPassword(req.params['identifier']).then(() =>{
            log.debug({response: 200}, 'Sending response from /user/password/reset');

            res.send(204);
            return next();
        }, (err) => {
            log.debug({response: err}, 'Sending response from /user/password/reset');

            res.send(500, err);
            return next();
        });
    } else {
        const response = {
            error: {
                code: 1012,
                message: appProperties.errorMessages['1012']
            }
        };

        log.debug({response: response}, 'Sending response from /user/password/reset');

        res.send(400, response);
        return next();
    }
});

server.get('/name-that-song/playlist/generate/:artist', (req, res, next) => {
    log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'Request to /playlist/generate/:artist');

    //generate playlist from artist given
    playlist.retrievePlaylistForArtist(req.params['artist']).then((playlist) => {
        //check that playlist has been given in correct format
        if (playlist.hasOwnProperty('response') &&
            playlist.response.hasOwnProperty('songs') &&
            playlist.response.songs.length >= 10) {

            const response = gameController.setAllSongs(playlist);

            log.debug({response: response}, 'sending response from /playlist/generate/:artist');

            //all good, send success
            res.send(200, response);
        } else {
            const response = {
                error: {
                    code: 1000,
                    message: appProperties.errorMessages['1000']
                }
            };

            log.error('No songs retrieved');
            log.debug({response: response}, 'sending response from /playlist/generate/:artist');

            //no songs retrieved for artist, send 404
            res.send(404, response);
        }
        return next();
    }, () => {
        const response = {
            error: {
                code: 1000,
                message: appProperties.errorMessages['1000']
            }
        };

        log.debug({response: response}, 'sending response from /playlist/generate/:artist');

        //error sent from echonest, bubble up
        res.send(404, response);
        return next();
    });
});

server.get('/name-that-song/song/random', (req, res, next) => {
    log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'request to /song/random');

    //playlist not yet generated, send 404
    if (gameController.getAllSongsLength() <= 0) {
        const response = {
            error: {
                code: 1001,
                message: appProperties.errorMessages['1001']
            }
        };

        log.error('No playlist generated');
        log.debug({response: response}, 'Sending response from /song/random');

        res.send(500, response);
        return next();
    }
    //maximum number of songs picked from playlist, send 403
    else if (gameController.getPickedSongsLength().length >= appProperties.playlistLength) {
        const response = {
            error: {
                code: 1002,
                message: appProperties.errorMessages['1002']
            }
        };

        log.error('Maximum songs retrieved from playlist');
        log.debug({response: response}, 'Sending response from /song/random');

        res.send(403, response);
        return next();
    }
    //pick a random song
    else {
        gameController.getRandomSong().then((previewUrl) => {
            const response = {
                url: previewUrl,
                playlistLength: gameController.getAllSongsLength(),
                songsLeft: gameController.getAllSongsLength() - gameController.getPickedSongsLength()
            };

            log.debug({response: response}, 'Sending response from /song/random');

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

            log.debug({response}, 'Sending response from /song/random');

            res.send(500, response);
            return next();
        });
    }
});

//TODO: t title matcher logic
server.post('/name-that-song/song/guess', function (req, res, next) {
    log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'request to /name-that-song/song/guess');

    const response = {correct: true, score: 1};

    log.debug({response: response}, 'Sending response from /name-that-song/song/guess');
    res.send(200, response);

    return next();
});

server.listen(appProperties.port, function () {
    log.debug('%s listening at %s', server.name, server.url);
});