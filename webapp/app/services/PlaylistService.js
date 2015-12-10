/**
 * Created by ericcarlton on 12/9/15.
 */
'use strict';

const serviceProperties = require('../config/serviceProperties.json');
(
    function(){
        angular.module('nameThatSong.playlist', []).service(
            'PlaylistService', ['$http', function ($http) {
                this.getPlaylist = function(artist){
                    return $http({
                        method: 'GET',
                        url: serviceProperties.host + serviceProperties.generatePlaylistRoute + artist,
                        timeout: serviceProperties.timeout
                    });
                };
            }]
        );
    }
)();