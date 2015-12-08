'use strict';

const restify = require('restify');
const playlist = require('./utils/playlist');
const appProperties = require('./config/appProperties');

const server = restify.createServer({
    name: 'name-that-song',
    version: '0.0.1'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

var allSongs = [];
var pickedSongs = [];

server.get('/name-that-song/playlist/generate/:artist', function (req, res, next) {
    playlist.retrievePlaylistForArtist(req.params['artist'], function (playlist, err) {
        if (err) {
            res.send(500, err);
        } else if (playlist.hasOwnProperty('response') &&
            playlist.response.hasOwnProperty('songs') &&
            playlist.response.songs.length > 0) {
            allSongs = playlist.response.songs;
            res.send(200);
        } else {
            res.send(400, {error: 'No songs retrieved, please pick a different artist'});
        }

        return next();
    });
});

server.get('/name-that-song/playlist/reset', function (req, res, next) {
    allSongs = [];
    pickedSongs = [];

    res.send(200);
    return next();
});

server.get('/name-that-song/song/random', function (req, res, next) {
    if (allSongs.length <= 0) {
        res.send(400, {error: 'Playlist Empty. First generate a playlist from the /playlist/:artist route'});
    } else if (pickedSongs.length >= appProperties.playlistLength) {
        res.send(400, {
            error: appProperties.playlistLength + ' songs already chosen from this playlist. Please ' +
            'generate a new playlist from the /playlist/:artist route'
        });
    }
    else {
        var song = playlist.pickRandomSong(allSongs, pickedSongs);
        playlist.getPreviewUrlForSong(song.artist, song.title, function (previewUrl, err) {
            if (err) {
                res.send(500, err);
            } else {
                res.send(200, {url: previewUrl});
            }
        });
    }
    return next();
});

server.listen(appProperties.port, function () {
    console.log('%s listening at %s', server.name, server.url);
});