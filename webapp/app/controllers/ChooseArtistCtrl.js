/**
 * Created by ericcarlton on 12/8/15.
 */
'use strict';

(function () {
    angular.module('nameThatSong.chooseArtist', []).controller(
        'ChooseArtistCtrl', ['$scope', 'PlaylistService', function ($scope, PlaylistService) {
            $scope.error = false;
            $scope.errorMessage = '';

            $scope.success = false;
            $scope.successMessage = '';

            $scope.artistLblText = 'Pick an artist: ';
            $scope.artist = '';

            $scope.generatePlaylist = function () {
                $scope.error = false;
                $scope.success = false;

                PlaylistService.getPlaylist($scope.artist).then(
                    function () {
                        $scope.successMessage = 'Generated playlist for ' + $scope.artist + '!';
                        $scope.success = true;
                    }, function () {
                        $scope.errorMessage = 'Unable to generate playlist for ' + $scope.artist + '. Please try again.';
                        $scope.error = true;
                    });
            };
        }]
    );
})();