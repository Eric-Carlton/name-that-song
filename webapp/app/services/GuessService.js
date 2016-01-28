/**
 * Created by ericcarlton on 1/27/16.
 */
'use strict';

const serviceProperties = require('../config/serviceProperties.json');
(function () {
        angular.module('nameThatSong.guess', []).service(
            'GuessService', ['$http', function ($http) {
                const _this = this;

                this.score = 0;

                this.makeGuess = function(song, artist){
                    return new Promise(function (resolve, reject) {
                        $http({
                            method: 'POST',
                            data: {song: song, artist: artist},
                            url: serviceProperties.host + serviceProperties.guessSongRoute,
                            timeout: serviceProperties.timeout
                        }).then(function (response) {
                            _this.score = response.score;
                            resolve();
                        }, function (err) {
                            reject(err);
                        });
                    });
                };

            }]
        );
})();