/**
 * Created by ericcarlton on 4/13/16.
 */
"use strict";

(function () {
    angular.module('nameThatSong.changePassword', []).controller(
        'ChangePasswordCtrl', ['$scope', 'UserService', '$location', function ($scope, UserService, $location) {
            //if the user from the UserService doesn't have an id, user has not successfully logged in
            if(!(UserService.user.hasOwnProperty('_id'))){
                $location.path('/login');
            } else {
                const changePasswordBtnTxt = 'Change password';
                const loadingBtnTxt = 'Loading...';

                $scope.pageHeadingTxt = 'Change Your Password';

                $scope.error = false;
                $scope.errorMessage = '';

                $scope.loading = false;

                $scope.changePasswordBtnTxt = changePasswordBtnTxt;
                $scope.oldPasswordLblTxt = 'Current Password: ';
                $scope.newPasswordLblTxt = 'New Password: ';
                $scope.confirmNewPasswordLblTxt = 'Confirm New Password: ';
                
                $scope.oldPassword = '';
                $scope.newPassword = '';
                $scope.confirmNewPassword = '';
                
                $scope.changePassword = () => {
                    if($scope.oldPassword.length <= 0){
                        $scope.error = true;
                        $scope.errorMessage = 'Current password is required';
                    } else if ($scope.newPassword.length <= 0){
                        $scope.error = true;
                        $scope.errorMessage = 'New password is required';
                    } else if ($scope.newPassword !== $scope.confirmNewPassword){
                        $scope.error = true;
                        $scope.errorMessage = 'Confirm password must match new password';
                    } else {
                        $scope.loading = true;
                        $scope.changePasswordBtnTxt = loadingBtnTxt;

                        UserService.changePassword($scope.oldPassword, $scope.newPassword).then(() => {
                            $scope.loading = false;

                            $scope.changePasswordBtnTxt = changePasswordBtnTxt;

                            $scope.$apply(() => {
                                UserService.user = {};
                                $location.path('/login');
                            });
                        }, (err) => {
                            $scope.loading = false;

                            $scope.changePasswordBtnTxt = changePasswordBtnTxt;

                            $scope.error = true;
                            $scope.errorMessage = err.message;

                            $scope.$apply();
                        });
                    }
                };
            }
        }]);
})();