/**
 * Created by ericcarlton on 2/13/16.
 */
'use strict';

(function () {
    const tooltip = require('tooltip');

    angular.module('nameThatSong.register', []).controller('RegisterCtrl',
        ['$scope', '$location', 'UserService', function ($scope, $location, UserService) {
            tooltip();

            const registerBtnTxt = 'Create Account';
            const loadingBtnTxt = 'Loading...';

            $scope.registerBtnTxt = registerBtnTxt;

            $scope.error = false;
            $scope.errorMessage = '';

            $scope.loading = false;

            $scope.registerUsernameLblTxt = 'Username: ';
            $scope.registerPasswordLblTxt = 'Password: ';
            $scope.confirmPasswordLblTxt = 'Confirm Password: ';
            $scope.registerEmailLblTxt = 'Email Address (Optional)';

            $scope.usernameAvailable = false;
            $scope.registerUsername = '';
            $scope.registerPassword = '';
            $scope.confirmRegisterPassword = '';
            $scope.registerEmail = '';

            $scope.$watch('registerUsername', (newVal) => {
                newVal = $scope.registerUsername;

                UserService.isUsernameAvailable(newVal).then(() => {
                    $scope.usernameAvailable = true;
                    $scope.$apply();
                }, () => {
                    $scope.usernameAvailable = false;
                    $scope.$apply();
                });
            });

            $scope.register = () => {
                if ($scope.registerUsername.length <= 0) {
                    $scope.error = true;

                    $scope.errorMessage = 'Username is required';
                } else if (!$scope.usernameAvailable) {
                    $scope.error = true;

                    $scope.errorMessage = 'Username is taken';
                } else if ($scope.registerPassword.length <= 0) {
                    $scope.error = true;

                    $scope.errorMessage = 'Password is required';
                } else if ($scope.registerPassword !== $scope.confirmRegisterPassword) {
                    $scope.error = true;

                    $scope.errorMessage = 'Passwords do not match';
                } else {
                    $scope.loading = true;

                    UserService.registerUser($scope.registerUsername, $scope.registerPassword, $scope.registerEmail).then(() => {
                        $scope.loading = false;

                        $scope.registerBtnTxt = registerBtnTxt;

                        $scope.$apply(() => {
                            $location.path('/login');
                        });
                    }, (err) => {
                        $scope.loading = false;

                        $scope.registerBtnTxt = loadingBtnTxt;

                        $scope.error = true;
                        $scope.errorMessage = err.message;

                        $scope.$apply();
                    });
                }
            };
        }]);
})();