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
    retrievePlaylistForArtist: (artist) => {
        const echonestUri = 'http://developer.echonest.com/api/v4/playlist/basic';
        const playlistProperties = {
            api_key: privateProperties.echonestApiKey,
            artist: artist,
            format: appProperties.echonestFormat,
            results: appProperties.echonestResults,
            type: appProperties.echonestType
        };

        return new Promise((resolve, reject) => {
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
                    if (response) {
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
    pickRandomSong: (allSongs, usedIndices) => {
        log.trace('Selecting song at random');

        let allSongsIdx = random.randomIntInc(0, allSongs.length);

        while (usedIndices.indexOf(allSongsIdx) > -1) {
            allSongsIdx = random.randomIntInc(0, allSongs.length);
        }

        usedIndices.push(allSongsIdx);

        const randomSong = {
            artist: allSongs[allSongsIdx].artist_name,
            title: allSongs[allSongsIdx].title
        };
        log.debug({song: randomSong}, 'Selected song');

        return randomSong;
    },

    /**
     * Get a Spotify preview URL for the song specified by artist and track
     * @param artist -      artist of song to retrieve preview url for
     * @param title -       title of song to retrieve preview url fo
     * @returns {Promise} - resolves on successful call to the Spotify API.  Rejects on unsuccessful call or if
     *                      the response is not in the expected format.
     */
    getPreviewUrlForSong: (artist, title) => {
        const previewRequest = {
            url: 'https://api.spotify.com/v1/search',
            qs: {
                type: 'track',
                q: title + ' artist:' + artist
            }
        };

        return new Promise((resolve, reject) => {
            log.debug({request: previewRequest}, 'Sending request for preview url');
            request(previewRequest, (err, response, body) => {
                if (!err && response.statusCode === 200) {
                    const songs = JSON.parse(body);

                    if (songs.hasOwnProperty('tracks') &&
                        songs.tracks.hasOwnProperty('items') &&
                        songs.tracks.items.length > 0) {

                        for (var songIdx = 0; songIdx < songs.tracks.items.length; songIdx++) {
                            var song = songs.tracks.items[songIdx];

                            if (song.name.toUpperCase() === title.toUpperCase()) {
                                log.trace({songName: title, url: song.previewUrl}, 'Found match for song');
                                if (song.hasOwnProperty('preview_url')) {
                                    log.debug({previewUrl: song.preview_url}, 'Preview URL retrieved from Spotify');

                                    resolve(song.preview_url);
                                }
                            }
                        }

                        reject();
                    }
                    log.error('No preview URL retrieved');
                    reject();

                } else {
                    if (response) {
                        log.error({statusCode: response.statusCode}, 'Request for preview URL returned status code other than 200');
                    }
                    if (err) {
                        log.error({error: err}, 'Received error while requesting preview URL');
                    }
                    reject();
                }
            });
        });
    }
};

