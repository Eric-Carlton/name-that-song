/**
 * Created by ericcarlton on 12/8/15.
 */
var angular = require('angular');

/* jshint ignore:start */
$ = jQuery = require('jquery');
const bootstrap = require('bootstrap');
/* jshint ignore:end */

require('./controllers/ChooseArtistCtrl.js');
require('./controllers/StartGameCtrl.js');

require('./services/PlaylistService.js');
require('./services/SongService.js');

var app = angular.module('nameThatSong', [
    'nameThatSong.chooseArtist',
    'nameThatSong.startGame',
    'nameThatSong.playlist',
    'nameThatSong.song'
]);

app.directive('chooseArtist', function () {
        return {
            restrict: 'E',
            templateUrl: 'templates/choose_artist.html',
            controller: 'ChooseArtistCtrl'
        };
    })
    .directive('startGame', function () {
        return {
            restrict: 'E',
            templateUrl: 'templates/start_game.html',
            controller: 'StartGameCtrl'
        };

    });
