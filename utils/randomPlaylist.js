/**
 * Created by ericcarlton on 12/7/15.
 */
'use strict';
module.exports = {
    /**
     * generates a random subset of the given playlist
     * @param allSongs - a playlist with an array of songs under the allSongs.response.songs property
     * @returns {Array} - a randomly generated subset of songs
     */
    generate: function(allSongs, playlistLength){

        let playlist = [];
        let usedIndices = [];

        //make sure the allSongs object has the correct properties
        if(allSongs.hasOwnProperty('response') && allSongs.response.hasOwnProperty('songs')){
            //randomly selected songs
            let songs = allSongs.response.songs;

            //get ten random songs and add to the playlist variable
            for(let i = 0; i < playlistLength; i++){
                let allSongsIdx = randomIntInc(1,10);

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
};

/**
 * Randomly selects an integer between low and high, inclusive
 * @param low - low end of random range
 * @param high - high end of random range
 * @returns {number} - random integer between low and high, inclusive
 */
function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}