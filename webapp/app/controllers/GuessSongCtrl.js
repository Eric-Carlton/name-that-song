/**
 * Created by ericcarlton on 1/27/16.
 */
'use strict';

(function () {
    angular.module('nameThatSong.guessSong', []).controller(
        'GuessSongCtrl', ['$scope', 'GuessService', function($scope, GuessService){
            $scope.sectionHeadingTxt = 'Name That Song!';

            $scope.error = false;
            $scope.errorMessage = '';

            $scope.success = false;
            $scope.successMessage = '';

            $scope.pickArtistLblTxt = 'Artist: ';
            $scope.artistGuessed = '';

            $scope.pickSongLblTxt = 'Song: ';
            $scope.songGuessed = '';

            $scope.submitBtnTxt = 'Submit Guess';

            $scope.makeGuess = () => {
                GuessService.makeGuess($scope.songGuessed, $scope.artistGuessed);

                //clear inputs
                $scope.artistGuessed = '';
                $scope.songGuessed = '';
            };
        }]
    );
})();

