/**
 * Created by ericcarlton on 12/7/15.
 */
'use strict';

var request = require('request');
var random = require('./random');
var privateProperties = require('../config/privateProperties');
var appProperties = require('../config/appProperties');

module.exports = {
    /**
     * Gets a playlist from echonest for the artist given
     * @param artist - name of artist to generate playlist from
     * @param callback - function to send results to
     */
    retrievePlaylistForArtist: function (artist, callback) {
        let playlistProperties = {
            api_key: privateProperties.echonestApiKey,
            artist: artist,
            format: appProperties.echonestFormat,
            results: appProperties.echonestResults,
            type: appProperties.echonestType
        };

        request({
            url: 'http://developer.echonest.com/api/v4/playlist/basic',
            qs: playlistProperties
        }, function (err, response, body) {
            if (err) {
                callback(null, err);
            } else {
                callback(JSON.parse(body), null);
            }
        });
    },

    /**
     * Picks a random, previously unselected song from the playlist provided
     * @param allSongs - full playlist of songs to pick a random song from
     * @param usedIndices - indices of already picked songs
     * @returns {{artist: string, title: (string)}} - song chosen
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
     * @param artist - artist of song to retrieve preview url for
     * @param title - title of song to retrieve preview url fo
     * @param callback - function to send results to ( previewUrl, err )
     */
    getPreviewUrlForSong: function (artist, title, callback) {
        let spotifyProperties = {
            type: 'track',
            q: title + ' artist:' + artist
        };

        request({url: 'https://api.spotify.com/v1/search', qs: spotifyProperties}, function (err, response, body) {
            if (err) {
                callback(null, err);
            } else {
                var song = JSON.parse(body);
                if (song.hasOwnProperty('tracks') &&
                    song.tracks.hasOwnProperty('items') &&
                    song.tracks.items.length > 0 &&
                    song.tracks.items[0].hasOwnProperty('preview_url')) {
                    callback(song.tracks.items[0].preview_url);
                } else {
                    callback(null, 'no tracks retrieved');
                }
            }
        });
    }
};

