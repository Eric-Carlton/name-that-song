/**
 * Created by ericcarlton on 1/30/16.
 */
'use strict';

const playlist = require('../utils/playlist');
const bunyan = require('bunyan');
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

let allSongs = [];
let pickedSongs = [];

module.exports = {

    setAllSongs: (playlist) => {
        allSongs = playlist.response.songs;
        log.trace({length: allSongs.length}, 'Playlist Set');
        pickedSongs = [];

        return {
            playlistLength: allSongs.length,
            songsLeft: allSongs.length - pickedSongs.length
        };
    },

    getRandomSong: () => {
        let song = playlist.pickRandomSong(allSongs, pickedSongs);

        log.debug({song: song}, 'Requesting song from Spotify');
        return new Promise((resolve, reject) => {
            playlist.getPreviewUrlForSong(song.artist, song.title).then(
                //preview url received, pass it along
                (previewUrl) => {
                    resolve(previewUrl);
                },
                //no preview url, send 500 to indicate that another song must be picked
                () => {
                    log.error({song: song}, 'Error occurred when requesting preview URL for song');

                    //remove last song, it won't count against songs picked
                    const invalidSongIdx = pickedSongs.pop();

                    allSongs.splice(invalidSongIdx, 1);

                    /*
                     * allSongs has changed. If any songs were picked whose index was after that of the removed
                     * song, they are now at their old index - 1.  pickedSongs must be adjusted to ensure that
                     * no duplicate songs are picked
                     */
                    for (let pickedSongsIdx = 0; pickedSongsIdx < pickedSongs.length; pickedSongsIdx++) {
                        if (pickedSongsIdx >= invalidSongIdx) {
                            pickedSongs[pickedSongsIdx]--;
                        }
                    }

                    reject();
                });
        });
    },

    getAllSongsLength: () => {
        return allSongs.length;
    },

    getPickedSongsLength: () => {
        return pickedSongs.length;
    }

};