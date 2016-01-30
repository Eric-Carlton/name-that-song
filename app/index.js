'use strict';
const bunyan = require('bunyan');
const restify = require('restify');
const appProperties = require('./config/appProperties');
const gameController = require('./controllers/gameController');
const playlist = require('./utils/playlist');

const log = bunyan.createLogger({
    name: 'name-that-song',
    streams: [
        {
            level: 'trace',
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
            const response = {error: 'No songs retrieved, please pick a different artist'};

            log.error('No songs retrieved');
            log.debug({response: response}, 'sending response from /playlist/generate/:artist');

            //no songs retrieved for artist, send 404
            res.send(404, response);
        }
        return next();
    }, () => {
        const response = {error: 'Error retrieving playlist. Please try again later'};

        log.debug({response: response}, 'sending response from /playlist/generate/:artist');

        //error sent from echonest, bubble up
        res.send(500, response);
        return next();
    });
});

server.get('/name-that-song/song/random', (req, res, next) => {
    log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'request to /song/random');

    //playlist not yet generated, send 404
    if (gameController.getAllSongsLength() <= 0) {
        const response = {error: 'Playlist Empty. First generate a playlist from the /playlist/:artist route'};

        log.error('No playlist generated');
        log.debug({response: response}, 'Sending response from /song/random');

        res.send(404, response);
        return next();
    }
    //maximum number of songs picked from playlist, send 403
    else if (gameController.getPickedSongsLength().length >= appProperties.playlistLength) {
        const response = {
            error: appProperties.playlistLength + ' songs already chosen from this playlist. Please ' +
            'generate a new playlist from the /playlist/:artist route'
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
                playlistLength: appProperties.playlistLength,
                songsLeft: appProperties.playlistLength - gameController.getPickedSongsLength()
            };

            log.debug({response: response}, 'Sending response from /song/random');

            res.send(200, response);
            return next();
        }, () => {
            const response = {
                error: 'Spotify unable to generate previewUrl',
                playlistLength: appProperties.playlistLength,
                songsLeft: appProperties.playlistLength - gameController.getPickedSongsLength()
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