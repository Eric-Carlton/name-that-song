/**
 * Created by ericcarlton on 4/13/16.
 */
"use strict";

(function () {
    angular.module('nameThatSong.account', []).controller(
        'AccountCtrl', ['$scope', 'UserService', '$location', function ($scope, UserService, $location) {
            //if the user from the UserService doesn't have an id, user has not successfully logged in
            if(!(UserService.user.hasOwnProperty('_id'))){
                $location.path('/login');
            } else {
                $scope.pageHeadingTxt = "Welcome, " + UserService.user.username;
                
                $scope.logout = () => {
                    //delete the user object so that redirection to the login page is enforced
                    UserService.user = {};
                    $location.path('/login');
                };
            }
        }]);
})();