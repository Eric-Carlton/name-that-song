/**
 * Created by ericcarlton on 12/9/15.
 */
'use strict';

(function () {
    angular.module('nameThatSong.startGame', []).controller(
        'StartGameCtrl', ['$rootScope', '$scope', 'PlaylistService', 'SongService', function ($rootScope, $scope, PlaylistService, SongService) {
            const startGameText = 'Let\'s get this party started!';
            const loadingText = 'Fetching song...';

            $scope.loading = false;
            $scope.startGameBtnText = startGameText;

            $scope.isNewGame = function () {
                return PlaylistService.playlistLength > 0 && PlaylistService.playlistLength === PlaylistService.songsLeft;
            };

            $scope.getSong = function () {
                $scope.loading = true;
                $scope.startGameBtnText = loadingText;

                PlaylistService.getSongFromPlaylist().then(
                    function () {
                        $scope.loading = false;
                        $scope.startGameBtnText = startGameText;
                    }, function (err) {
                        $scope.loading = false;
                        $scope.startGameBtnText = startGameText;

                        console.log(err);
                    });
            };

            $rootScope.$on("newSongReceived", function(evt, args){
                console.log(args);
                SongService.play(args.url);
            });
        }]
    );
})();