'use strict';

var restify = require('restify');
var http = require('http');
var request = require('request');
var randomPlaylist = require('./utils/randomPlaylist');

var server = restify.createServer({
    name: 'name-that-song',
    version: '0.0.1'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/name-that-song/playlist/:artist', function (req, res, next) {
    let artist = req.params['artist'];

    let playlistProperties = {
        api_key: 'TRGGC3NEIUP7ERGYA',
        artist: artist,
        format: 'json',
        results: 200,
        type: 'artist-radio'
    };

    request({url:'http://developer.echonest.com/api/v4/playlist/basic', qs:playlistProperties}, function(err, response, body) {
        if(err) {
            res.send(err);
            return next();
        } else {
            let allTracks = JSON.parse(body);
            let playlist = randomPlaylist.generate(allTracks, 10);

            res.send( playlist );
            return next();
        }
    });
});

server.listen(4701, function () {
    console.log('%s listening at %s', server.name, server.url);
});