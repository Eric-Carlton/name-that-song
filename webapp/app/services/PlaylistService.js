/**
 * Created by ericcarlton on 12/9/15.
 */
'use strict';
(
    function(){
        angular.module('nameThatSong.playlist', []).service(
            'PlaylistService', ['$http', function ($http) {
                this.getPlaylist = function(artist){
                    return $http({
                        method: 'GET',
                        url: 'http://localhost:8008//name-that-song/playlist/generate/' + artist
                    });
                };
            }]
        );
    }
)();