'use strict';

var restify = require('restify');
var playlist = require('./utils/playlist');
var appProperties = require('./config/appProperties');

var server = restify.createServer({
    name: 'name-that-song',
    version: '0.0.1'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/name-that-song/playlist/:artist', function (req, res, next) {
    playlist.retrievePlaylistForArtist(req.params['artist'], function(playlist, err){
        if(err){
            res.send(500, err);
        } else {
            res.send(200, playlist);
        }

        return next();
    });
});

server.listen(appProperties.port, function () {
    console.log('%s listening at %s', server.name, server.url);
});