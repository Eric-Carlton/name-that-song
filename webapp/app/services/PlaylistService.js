/**
 * Created by ericcarlton on 12/9/15.
 */
'use strict';

const serviceProperties = require('../config/serviceProperties.json');
(function () {
    angular.module('nameThatSong.playlist', []).service(
        'PlaylistService', ['$rootScope', '$http', function ($rootScope, $http) {
            const _this = this;

            this.playlistLength = 0;
            this.songsLeft = 0;

            this.getPlaylist = (artist) => {
                //reset
                _this.playlistLength = 0;
                _this.songsLeft = 0;

                return new Promise((resolve, reject) => {
                    $http({
                        method: 'GET',
                        url: serviceProperties.host + serviceProperties.generatePlaylistRoute + artist,
                        timeout: serviceProperties.timeout
                    }).then((res) => {
                        _this.songsLeft = res.data.songsLeft;
                        _this.playlistLength = res.data.playlistLength;

                        resolve();
                    }, (err) => {
                        if(err && err.hasOwnProperty('data') && err.data && err.data.hasOwnProperty('error') &&
                            err.data.error && err.data.error.hasOwnProperty('message') && err.data.error.message &&
                            err.data.error.hasOwnProperty('code') && err.data.error.code){
                            reject(err.data.error);
                        } else {
                            reject({
                                code: '0000',
                                message: 'Unable to generate playlist. Please check internet connection and try again.'
                            });
                        }
                    });
                });
            };

            this.getSongFromPlaylist = () => {
                return new Promise((resolve, reject) => {
                    $http({
                        method: 'GET',
                        url: serviceProperties.host + serviceProperties.randomSongRoute,
                        timeout: serviceProperties.timeout
                    }).then((response) => {
                        _this.playlistLength = response.data.playlistLength;
                        _this.songsLeft = response.data.songsLeft;

                        $rootScope.$broadcast("newSongReceived", {url: response.data.url});

                        resolve();
                    }, (err) => {
                        if(err && err.hasOwnProperty('data') && err.data && err.data.hasOwnProperty('error') &&
                            err.data.error && err.data.error.hasOwnProperty('message') && err.data.error.message &&
                            err.data.error.hasOwnProperty('code') && err.data.error.code){
                            reject(err.data.error);
                        } else {
                            reject({
                                code: '0000',
                                message: 'Unable to retrieve preview track for song.  Please check internet connection and try again.'
                            });
                        }
                    });
                });
            };
        }]
    );
})();