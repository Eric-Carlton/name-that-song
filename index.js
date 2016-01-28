'use strict';

const restify = require('restify');
const playlist = require('./utils/playlist');
const appProperties = require('./config/appProperties');
const bunyan = require('bunyan');
const log = bunyan.createLogger({
    name: 'name-that-song',
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
    log.trace('Entering: /playlist/generate/:artist');

    //reset allSongs and pickedSongs
    log.trace('Resetting allSongs and pickedSongs');
    allSongs = [];
    pickedSongs = [];

    //generate playlist from artist given
    log.debug('Requesting playlist for artist ' + req.params['artist']);
    playlist.retrievePlaylistForArtist(req.params['artist']).then(function (playlist) {
        //check that playlist has been given in correct format
        if (playlist.hasOwnProperty('response') &&
            playlist.response.hasOwnProperty('songs') &&
            playlist.response.songs.length >= 10) {
            allSongs = playlist.response.songs;

            log.debug('Playlist retrieved with length: ' + playlist.response.songs.length);
            log.trace('Exiting: /playlist/generate/:artist');
            //all good, send success
            res.send(200, {
                playlistLength: appProperties.playlistLength,
                songsLeft: appProperties.playlistLength - pickedSongs.length
            });
        } else {
            log.error('No songs retrieved');
            log.trace('Exiting: /playlist/generate/:artist');
            //no songs retrieved for artist, send 404
            res.send(404, {error: 'No songs retrieved, please pick a different artist'});
        }
        return next();
    }, function (err) {
        console.error('Echonest error: ' + err);
        log.trace('Exiting: /playlist/generate/:artist');
        //error sent from echonest, bubble up
        res.send(500, err);
        return next();
    });
});

server.get('/name-that-song/song/random', function (req, res, next) {
    log.trace('Entering: /song/random');

    function getRandomSong() {
        var song = playlist.pickRandomSong(allSongs, pickedSongs);
        log.debug('Requesting song from Spotify: ' + JSON.stringify(song));
        playlist.getPreviewUrlForSong(song.artist, song.title).then(
            //preview url received, pass it along
            function (previewUrl) {
                songFound(previewUrl);
            },
            //no preview url, send 500 to indicate that another song must be picked
            function () {
                log.error('Reject from Spotify');
                log.trace('Song to remove: ' + song);
                log.trace('allSongs before cut: ' + allSongs);
                //remove last song, it won't count against songs picked
                let invalidSongIdx = pickedSongs.pop();
                allSongs.splice(invalidSongIdx, 1);
                log.trace('allSongs after cut: ' + allSongs);
                /*
                 * allSongs has changed. If any songs were picked whose index was after that of the removed
                 * song, they are now at their old index - 1.  pickedSongs must be adjusted to ensure that
                 * no duplicate songs are picked
                 */
                log.trace('pickedSongs before adjustment: ' + pickedSongs);
                for (let pickedSongsIdx = 0; pickedSongsIdx < pickedSongs.length; pickedSongsIdx++) {
                    if (pickedSongsIdx >= invalidSongIdx) {
                        pickedSongs[pickedSongsIdx]--;
                    }
                }
                log.trace('pickedSongs after adjustment: ' + pickedSongs);

                //get another random song
                getRandomSong();
            });
    }

    function songFound(previewUrl) {
        log.debug('PreviewUrl retrieved: ' + previewUrl);
        log.trace('Exiting: /song/random');
        res.send(200, {
            url: previewUrl,
            playlistLength: appProperties.playlistLength,
            songsLeft: appProperties.playlistLength - pickedSongs.length
        });
        return next();
    }

    //playlist not yet generated, send 404
    if (allSongs.length <= 0) {
        log.error('No playlist generated');
        log.trace('Exiting: /song/random');
        res.send(404, {error: 'Playlist Empty. First generate a playlist from the /playlist/:artist route'});
        return next();
    }
    //maximum number of songs picked from playlist, send 403
    else if (pickedSongs.length >= appProperties.playlistLength) {
        log.error('Maximum songs retrieved from playlist');
        log.trace('Exiting: /song/random');
        res.send(403, {
            error: appProperties.playlistLength + ' songs already chosen from this playlist. Please ' +
            'generate a new playlist from the /playlist/:artist route'
        });
        return next();
    }
    //pick a random song
    else {
        getRandomSong();
    }
});

server.listen(appProperties.port, function () {
    log.debug('%s listening at %s', server.name, server.url);
});