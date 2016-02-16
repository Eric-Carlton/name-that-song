/**
 * Created by ericcarlton on 12/8/15.
 */
'use strict';
/* jshint ignore:start */
const bootstrap = require('bootstrap');
/* jshint ignore:end */

let angular = require('angular');
require('angular-router-browserify')(angular);

require('./controllers/GameCtrl.js');
require('./controllers/ChooseArtistCtrl.js');
require('./controllers/StartGameCtrl.js');
require('./controllers/GuessSongCtrl.js');
require('./controllers/LoginCtrl.js');
require('./controllers/RegisterCtrl.js');
require('./controllers/ResetPasswordCtrl.js');

require('./services/PlaylistService.js');
require('./services/SongService.js');
require('./services/GuessService.js');
require('./services/UserService.js');

let app = angular.module('nameThatSong', [
    'ngRoute',
    'nameThatSong.chooseArtist',
    'nameThatSong.startGame',
    'nameThatSong.playlist',
    'nameThatSong.song',
    'nameThatSong.guessSong',
    'nameThatSong.guess',
    'nameThatSong.game',
    'nameThatSong.login',
    'nameThatSong.user',
    'nameThatSong.register',
    'nameThatSong.resetPassword'
]);

app.config(['$routeProvider', ($routeProvider) => {
    $routeProvider.when('/game', {
            templateUrl: 'templates/game_view.html',
            controller: 'GameCtrl'
        })
        .when('/login', {
            templateUrl: 'templates/login_view.html',
            controller: 'LoginCtrl'
        })
        .when('/register', {
            templateUrl: 'templates/register_view.html',
            controller: 'RegisterCtrl'
        })
        .when('/reset-password', {
            templateUrl: 'templates/reset_password_view.html',
            controller: 'ResetPasswordCtrl'
        })
        .otherwise({redirectTo: '/game'});
}]);

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
