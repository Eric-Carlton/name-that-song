/**
 * Created by ericcarlton on 12/9/15.
 */
'use strict';

(function() {
    angular.module('nameThatSong.startGame', []).controller(
        'StartGameCtrl', ['$rootScope', '$scope', 'PlaylistService', 'SongService', function($rootScope, $scope, PlaylistService, SongService) {
            const startGameText = 'Let\'s get this party started!';
            const loadingText = 'Fetching song...';

            const _this = this;

            this.retries = 3;

            $scope.error = false;
            $scope.errorMessage = 'There appears to be an error retrieving songs.  Please generate a new playlist and try again';

            $scope.loading = false;
            $scope.startGameBtnText = startGameText;

            $scope.isNewGame = () => {
                return PlaylistService.playlistLength > 0 && PlaylistService.playlistLength === PlaylistService.songsLeft;
            };

            $scope.getSong = () => {
                $scope.loading = true;
                $scope.startGameBtnText = loadingText;

                PlaylistService.getSongFromPlaylist().then(
                    () => {
                        _this.retries = 3;

                        $scope.loading = false;
                        $scope.startGameBtnText = startGameText;

                        $scope.$apply();
                    }, () => {
                        _this.retries--;

                        if(_this.retries > 0){
                            console.log('Trying to get a new song. Retries left: ' + _this.retries);
                            $scope.getSong();
                        } else {
                            $scope.loading = false;
                            $scope.startGameBtnText = startGameText;

                            $scope.success = false;
                            $scope.error = true;
                        }

                        $scope.$apply();
                    });
            };

            $rootScope.$on("newSongReceived", (evt, args) => {
                SongService.play(args.url);
            });
        }]
    );
})();