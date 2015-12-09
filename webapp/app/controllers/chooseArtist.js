/**
 * Created by ericcarlton on 12/8/15.
 */
'use strict';

(
    function(){
        angular.module('nameThatSong.chooseArtist', []).controller(
            'ChooseArtistCtrl', ['$scope', function ($scope) {
                $scope.text = 'Pick an artist';
            }]
        );
    }
)();