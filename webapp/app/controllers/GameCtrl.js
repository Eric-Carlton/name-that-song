/**
 * Created by ericcarlton on 2/13/16.
 */
'use strict';

(function () {
    angular.module('nameThatSong.game', []).controller(
        'GameCtrl', ['UserService', '$location', function (UserService, $location) {
            //if the user from the UserService doesn't have an id, user has not successfully logged in
            if(!(UserService.user.hasOwnProperty('id'))){
                $location.path('/login');
            }
        }]);
})();