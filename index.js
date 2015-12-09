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
    //generate playlist from artist given
    playlist.retrievePlaylistForArtist(req.params['artist']).then(function (playlist) {
        //check that playlist has been given in correct format
        if (playlist.hasOwnProperty('response') &&
            playlist.response.hasOwnProperty('songs') &&
            playlist.response.songs.length > 0) {
            allSongs = playlist.response.songs;
            //all good, send success
            res.send(200);
        } else {
            //no songs retrieved for artist, send 404
            res.send(404, {error: 'No songs retrieved, please pick a different artist'});

        }
        return next();
    }, function (err) {
        //error sent from echonest, bubble up
        res.send(500, err);
        return next();
    });
});

server.get('/name-that-song/playlist/reset', function (req, res, next) {
    //reset allSongs and pickedSongs
    allSongs = [];
    pickedSongs = [];

    //send success message
    res.send(200);
    return next();
});

server.get('/name-that-song/song/random', function (req, res, next) {
    function getRandomSong(){
        var song = playlist.pickRandomSong(allSongs, pickedSongs);

        playlist.getPreviewUrlForSong(song.artist, song.title).then(
            //preview url received, pass it along
            function (previewUrl) {
                songFound(previewUrl);
            },
            //no preview url, send 500 to indicate that another song must be picked
            function () {
                //remove last song, it won't count against songs picked
                let invalidSongIdx = pickedSongs.pop();
                allSongs.splice(invalidSongIdx, 1);
                /*
                * allSongs has changed. If any songs were picked whose index was after that of the removed
                * song, they are now at their old index - 1.  pickedSongs must be adjusted to ensure that
                * no duplicate songs are picked
                */
                for(let pickedSongsIdx = 0; pickedSongsIdx < pickedSongs.length; pickedSongsIdx++){
                    if(pickedSongsIdx >= invalidSongIdx){
                        pickedSongs[pickedSongsIdx]--;
                    }
                }

                //get another random song
                getRandomSong();
            });
    }

    function songFound(previewUrl){
        res.send(200, {url: previewUrl});
        return next();
    }

    //playlist not yet generated, send 404
    if (allSongs.length <= 0) {
        res.send(404, {error: 'Playlist Empty. First generate a playlist from the /playlist/:artist route'});
        return next();
    }
    //maximum number of songs picked from playlist, send 403
    else if (pickedSongs.length >= appProperties.playlistLength) {
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
    console.log('%s listening at %s', server.name, server.url);
});