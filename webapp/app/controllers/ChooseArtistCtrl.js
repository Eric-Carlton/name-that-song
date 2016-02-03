/**
 * Created by ericcarlton on 12/8/15.
 */
'use strict';

(function () {
    angular.module('nameThatSong.chooseArtist', []).controller(
        'ChooseArtistCtrl', ['$scope', 'PlaylistService', function ($scope, PlaylistService) {
            const generatePlaylistText = 'Generate Playlist';
            const loadingText = 'Generating...';

            $scope.error = false;
            $scope.errorMessage = '';

            $scope.success = false;
            $scope.successMessage = '';

            $scope.artistLblText = 'Pick an artist: ';
            $scope.artist = '';

            $scope.loading = false;
            $scope.generatePlaylistBtnText = generatePlaylistText;

            $scope.generatePlaylist = function () {
                $scope.error = false;
                $scope.success = false;

                $scope.loading = true;
                $scope.generatePlaylistBtnText = loadingText;

                PlaylistService.getPlaylist($scope.artist).then(() => {
                    $scope.loading = false;
                    $scope.generatePlaylistBtnText = generatePlaylistText;

                    $scope.successMessage = 'Generated playlist for ' + $scope.artist + '!';
                    $scope.success = true;

                    $scope.$apply();
                }, (err) => {
                    $scope.loading = false;
                    $scope.generatePlaylistBtnText = generatePlaylistText;

                    $scope.errorMessage = err.message;
                    $scope.success = false;
                    $scope.error = true;

                    $scope.$apply();
                });
            };
        }]
    );
})();