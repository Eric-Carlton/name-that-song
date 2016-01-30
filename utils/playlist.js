/**
 * Created by ericcarlton on 12/7/15.
 */
'use strict';
const bunyan = require('bunyan');
const request = require('request');
const random = require('./random');
const privateProperties = require('../config/privateProperties');
const appProperties = require('../config/appProperties');

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

module.exports = {
    /**
     *
     */

    /**
     * Gets a playlist from echonest for the artist given
     * @param artist -      name of artist to generate playlist from
     * @returns {Promise} - Resolves on successful call to echonest API. Rejects on unsuccessful call or if the
     *                      response is not in the expected format.
     */
    retrievePlaylistForArtist: function (artist) {
        const echonestUri = 'http://developer.echonest.com/api/v4/playlist/basic';
        const playlistProperties = {
            api_key: privateProperties.echonestApiKey,
            artist: artist,
            format: appProperties.echonestFormat,
            results: appProperties.echonestResults,
            type: appProperties.echonestType
        };

        return new Promise(function (resolve, reject) {
            log.debug({uri: echonestUri, request: playlistProperties}, 'Sending request for playlist');
            request({
                url: echonestUri,
                qs: playlistProperties
            }, (err, response, body) => {
                if (!err && response.statusCode === 200) {
                    const playlist = JSON.parse(body);
                    log.debug({playlist: playlist}, 'Received playlist');
                    resolve(playlist);
                } else {
                    if(response){
                        log.error({statusCode: response.statusCode}, 'Request for playlist returned status code other than 200');
                    }
                    if (err) {
                        log.error({error: err}, 'Received error while request playlist');
                    }
                    reject();
                }
            });
        });
    },

    /**
     * Picks a random, previously unselected song from the playlist provided
     * @param allSongs -                                full playlist of songs to pick a random song from
     * @param usedIndices -                             indices of already picked songs
     * @returns {{artist: string, title: (string)}} -   song chosen
     */
    pickRandomSong: function (allSongs, usedIndices) {
        let allSongsIdx = random.randomIntInc(0, allSongs.length);

        while (usedIndices.indexOf(allSongsIdx) > -1) {
            allSongsIdx = random.randomIntInc(0, allSongs.length);
        }

        usedIndices.push(allSongsIdx);
        return {
            artist: allSongs[allSongsIdx].artist_name,
            title: allSongs[allSongsIdx].title
        };
    },

    /**
     * Get a Spotify preview URL for the song specified by artist and track
     * @param artist -      artist of song to retrieve preview url for
     * @param title -       title of song to retrieve preview url fo
     * @returns {Promise} - resolves on successful call to the Spotify API.  Rejects on unsuccessful call or if
     *                      the response is not in the expected format.
     */
    getPreviewUrlForSong: function (artist, title) {
        let spotifyProperties = {
            type: 'track',
            q: title + ' artist:' + artist
        };

        return new Promise(function (resolve, reject) {
            request({url: 'https://api.spotify.com/v1/search', qs: spotifyProperties}, function (err, response, body) {
                if (err) {
                    reject(err);
                } else {
                    var song = JSON.parse(body);
                    if (song.hasOwnProperty('tracks') &&
                        song.tracks.hasOwnProperty('items') &&
                        song.tracks.items.length > 0 &&
                        song.tracks.items[0].hasOwnProperty('preview_url')) {
                        resolve(song.tracks.items[0].preview_url);
                    } else {
                        reject({err: 'no songs received'});
                    }
                }
            });
        });
    }
};

