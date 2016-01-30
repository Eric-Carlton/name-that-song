/**
 * Created by ericcarlton on 12/8/15.
 */
'use strict';
/* jshint ignore:start */
const bootstrap = require('bootstrap');
/* jshint ignore:end */

let angular = require('angular');

require('./controllers/ChooseArtistCtrl.js');
require('./controllers/StartGameCtrl.js');
require('./controllers/GuessSongCtrl.js');

require('./services/PlaylistService.js');
require('./services/SongService.js');
require('./services/GuessService.js');

let app = angular.module('nameThatSong', [
    'nameThatSong.chooseArtist',
    'nameThatSong.startGame',
    'nameThatSong.playlist',
    'nameThatSong.song',
    'nameThatSong.guessSong',
    'nameThatSong.guess'
]);

app.directive('chooseArtist', () => {
        return {
            restrict: 'E',
            templateUrl: 'templates/choose_artist.html',
            controller: 'ChooseArtistCtrl'
        };
    })
    .directive('startGame', () => {
        return {
            restrict: 'E',
            templateUrl: 'templates/start_game.html',
            controller: 'StartGameCtrl'
        };

    })
    .directive('guessSong', () => {
        return {
            restrict: 'E',
            templateUrl: 'templates/guess_song.html',
            controller: 'GuessSongCtrl'
        };
    });
