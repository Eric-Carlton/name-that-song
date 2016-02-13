/**
 * Created by ericcarlton on 2/13/16.
 */
'use strict';

(function () {
    angular.module('nameThatSong.login', []).controller(
        'LoginCtrl', ['$scope', '$location', 'UserService', function ($scope, $location, UserService) {
            const loginBtnTxt = 'Login';
            const loadingBtnTxt = 'Loading...';

            $scope.loginBtnTxt = loginBtnTxt;
            $scope.usernameLblTxt = 'Username: ';
            $scope.passwordLblTxt = 'Password: ';

            $scope.error = false;
            $scope.errorMessage = '';

            $scope.loading = false;

            $scope.username = '';
            $scope.password = '';

            $scope.login = () => {
                $scope.loginBtnTxt = loadingBtnTxt;
                $scope.loading = true;

                UserService.loginUser($scope.username, $scope.password).then(() => {
                    $scope.loading = false;
                    $scope.loginBtnTxt = loginBtnTxt;

                    //login successful, move to the default page
                    $scope.$apply(() =>{
                        $location.path('/');
                    });
                }, (err) => {
                    $scope.loading = false;

                    $scope.error = true;
                    $scope.errorMessage = err.message;

                    $scope.loginBtnTxt = loginBtnTxt;

                    $scope.$apply();
                });
            };
        }]);
})();