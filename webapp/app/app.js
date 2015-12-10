/**
 * Created by ericcarlton on 12/8/15.
 */
var angular = require('angular');
/* jshint ignore:start */
$ = jQuery = require('jquery');
var bootstrap = require('bootstrap');
/* jshint ignore:end */
require('./controllers/ChooseArtistCtrl.js');
require('./services/PlaylistService.js');

var app = angular.module('nameThatSong', [
    'nameThatSong.chooseArtist',
    'nameThatSong.playlist'
]);

app.directive('chooseArtist', function(){
    return {
        restrict: 'E',
        templateUrl: 'templates/choose_artist.html',
        controller: 'ChooseArtistCtrl'
    };
});
