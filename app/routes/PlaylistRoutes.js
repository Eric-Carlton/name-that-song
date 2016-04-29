/**
 * Created by ericcarlton on 4/28/16.
 */
"use strict";

const bunyan = require('bunyan');
const appProperties = require('../config/appProperties');
const gameController = require('../controllers/gameController');
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

class PlaylistRoutes{
    /**
     * Sets this.server.
     * @param server    -   A restify server.
     */
    constructor(server) {
        this.server = server;
    }
    
    createRoutes(){
        this.server.get('/api/playlist/generate/:artist', (req, res, next) => {
            log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'Request to /playlist/generate/:artist');

            //generate playlist from artist given
            playlist.retrievePlaylistForArtist(req.params.artist).then((playlist) => {
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
    }
}

module.exports = PlaylistRoutes;