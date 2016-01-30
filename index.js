'use strict';
const bunyan = require('bunyan');
const restify = require('restify');
const playlist = require('./utils/playlist');
const appProperties = require('./config/appProperties');

const log = bunyan.createLogger({
    name: 'name-that-song',
    //TODO: rolling log files!
    streams: [
        {
            level: 'trace',
            stream: process.stdout         // log INFO and above to stdout
        },
        {
            level: 'trace',
            path: 'log/name-that-song.log'
        }
    ]
});

const server = restify.createServer({
    name: 'name-that-song',
    version: '0.0.1'
});

server.use(
    function crossOrigin(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        return next();
    }
);

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

var allSongs = [];
var pickedSongs = [];

server.get('/name-that-song/playlist/generate/:artist', function (req, res, next) {
    log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'Request to /playlist/generate/:artist');

    //reset allSongs and pickedSongs
    allSongs = [];
    pickedSongs = [];

    //generate playlist from artist given
    playlist.retrievePlaylistForArtist(req.params['artist']).then((playlist) => {

        //check that playlist has been given in correct format
        if (playlist.hasOwnProperty('response') &&
            playlist.response.hasOwnProperty('songs') &&
            playlist.response.songs.length >= 10) {
            allSongs = playlist.response.songs;

            const response = {
                playlistLength: appProperties.playlistLength,
                songsLeft: appProperties.playlistLength - pickedSongs.length
            };

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

//TODO: This is a mess.  Refactor.
server.get('/name-that-song/song/random', function (req, res, next) {
    log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'request to /song/random');

    function getRandomSong() {
        var song = playlist.pickRandomSong(allSongs, pickedSongs);
        log.debug({song: song}, 'Requesting song from Spotify');
        playlist.getPreviewUrlForSong(song.artist, song.title).then(
            //preview url received, pass it along
            function (previewUrl) {
                songFound(previewUrl);
            },
            //no preview url, send 500 to indicate that another song must be picked
            function () {
                log.error({song: song}, 'Spotify rejected request for song');
                log.trace({song: song}, 'Remove song from allSongs variable');
                log.trace({allSongs: allSongs}, 'allSongs before cut');
                //remove last song, it won't count against songs picked
                let invalidSongIdx = pickedSongs.pop();
                allSongs.splice(invalidSongIdx, 1);
                log.trace({allSongs: allSongs}, 'allSongs after cut');
                /*
                 * allSongs has changed. If any songs were picked whose index was after that of the removed
                 * song, they are now at their old index - 1.  pickedSongs must be adjusted to ensure that
                 * no duplicate songs are picked
                 */
                log.trace({pickedSongs: pickedSongs}, 'pickedSongs before adjustment');
                for (let pickedSongsIdx = 0; pickedSongsIdx < pickedSongs.length; pickedSongsIdx++) {
                    if (pickedSongsIdx >= invalidSongIdx) {
                        pickedSongs[pickedSongsIdx]--;
                    }
                }
                log.trace({pickedSongs: pickedSongs}, 'pickedSongs after adjustment');

                //get another random song
                getRandomSong();
            });
    }

    function songFound(previewUrl) {
        const response = {
            url: previewUrl,
            playlistLength: appProperties.playlistLength,
            songsLeft: appProperties.playlistLength - pickedSongs.length
        };

        log.debug({previewUrl: previewUrl}, 'PreviewUrl retrieved');
        log.debug({response: response}, 'Sending response from /song/random');
        res.send(200, response);
        return next();
    }

    //playlist not yet generated, send 404
    if (allSongs.length <= 0) {
        const response = {error: 'Playlist Empty. First generate a playlist from the /playlist/:artist route'};
        log.error('No playlist generated');
        log.debug({response: response}, 'Sending response from /song/random');
        res.send(404, response);
        return next();
    }
    //maximum number of songs picked from playlist, send 403
    else if (pickedSongs.length >= appProperties.playlistLength) {
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
        getRandomSong();
    }
});

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