/**
 * Created by ericcarlton on 12/8/15.
 */
var angular = require('angular');
/* jshint ignore:start */
$ = jQuery = require('jquery');
var bootstrap = require('bootstrap');
/* jshint ignore:end */
require('./components/chooseArtist.js');

var app = angular.module('nameThatSong', [
    'nameThatSong.chooseArtist'
]);

app.directive('chooseArtist', function(){
    return {
        restrict: 'E',
        templateUrl: 'templates/chooseArtist.html',
        controller: 'ChooseArtistCtrl'
    };
});
