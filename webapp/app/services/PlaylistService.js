/**
 * Created by ericcarlton on 12/9/15.
 */
'use strict';

const serviceProperties = require('../config/serviceProperties.json');
(
    function(){
        angular.module('nameThatSong.playlist', []).service(
            'PlaylistService', ['$rootScope', '$http', function ($rootScope, $http) {
                const _this = this;

                this.playlistLength = 0;
                this.songsLeft = 0;

                this.getPlaylist = function(artist){
                    //reset
                    this.playlistLength = 0;
                    this.songsLeft = 0;

                    return $http({
                        method: 'GET',
                        url: serviceProperties.host + serviceProperties.generatePlaylistRoute + artist,
                        timeout: serviceProperties.timeout
                    });
                }.bind(this);

                this.getSongFromPlaylist = function(){
                    return new Promise(function(resolve, reject){
                       $http({
                           method: 'GET',
                           url: serviceProperties.host + serviceProperties.randomSongRoute,
                           timeout: serviceProperties.timeout
                       }).then(function(response){
                           _this.playlistLength = response.data.playlistLength;
                           _this.songsLeft = response.data.songsLeft;

                           console.log(response.data.url);
                           $rootScope.$broadcast("newSongReceived", { url: response.data.url });

                           resolve();
                       }, function(err){
                           reject(err);
                       });
                    });
                };
            }]
        );
    }
)();