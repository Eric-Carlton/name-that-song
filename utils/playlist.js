/**
 * Created by ericcarlton on 12/7/15.
 */
'use strict';

var http = require('http');
var request = require('request');
var random = require('./random');
var privateProperties = require('../config/privateProperties');
var appProperties = require('../config/appProperties');

module.exports = {
    /**
     * Gets a 10 song playlist based on the artist provided
     * @param artist - name of artist to generate playlist from
     * @param callback - function to send results to
     */
    retrievePlaylistForArtist: function(artist, callback){
        getEchonestPlaylistForArtist(artist, function(playlist, err){
            if(err){
                callback(null, err);
            } else {
                callback(randomizePlaylist(playlist), null);
            }
        });
    }
};

/**
 * Gets a playlist from echonest for the artist given
 * @param artist - name of artist to generate playlist from
 * @returns {Array} - a playlist generated from the artist specified
 */
function getEchonestPlaylistForArtist(artist, callback){
    let playlistProperties = {
        api_key: privateProperties.echonestApiKey,
        artist: artist,
        format: appProperties.echonestFormat,
        results: appProperties.echonestResults,
        type: appProperties.echonestType
    };

    request({url:'http://developer.echonest.com/api/v4/playlist/basic', qs:playlistProperties}, function(err, response, body) {
        if(err) {
            callback(null, err);
        } else {
            callback(JSON.parse(body), null);
        }
    });
}

/**
 * generates a random subset of the given playlist
 * @param allSongs - a playlist with an array of songs under the allSongs.response.songs property
 * @returns {Array} - a randomly generated subset of songs
 */
function randomizePlaylist (allSongs){

    let playlist = [];
    let usedIndices = [];

    //make sure the allSongs object has the correct properties
    if(allSongs.hasOwnProperty('response') && allSongs.response.hasOwnProperty('songs')){
        //randomly selected songs
        let songs = allSongs.response.songs;

        //get ten random songs and add to the playlist variable
        for(let i = 0; i < appProperties.playlistLength; i++){
            let allSongsIdx = random.randomIntInc(1,10);

            //don't add the same song twice
            if(usedIndices.indexOf(allSongsIdx) <= -1){
                usedIndices.push(allSongsIdx);
                playlist.push({
                    artist: allSongs.response.songs[allSongsIdx].artist_name,
                    title: allSongs.response.songs[allSongsIdx].title
                });
            } else {
                i--;
            }

        }
    }
    return playlist;
}
