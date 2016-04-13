/**
 * Created by ericcarlton on 2/15/16.
 */
'use strict';

(function () {
    angular.module('nameThatSong.resetPassword', []).controller('ResetPasswordCtrl',
        ['$scope', 'UserService', function ($scope, UserService) {
            const resetPasswordBtnText = 'Reset Password';
            const loadingBtnText = 'Loading...';

            $scope.pageHeadingTxt = 'Reset Your Password';

            $scope.resetPasswordBtnTxt = resetPasswordBtnText;

            $scope.loading = false;

            $scope.error = false;
            $scope.errorMessage = '';

            $scope.success = false;
            $scope.successMessage = 'Your password has been reset.  An email containing your new password has been sent to your email address';

            $scope.identifierLblTxt = 'Username or email address: ';
            $scope.identifier = '';

            $scope.resetPassword = () => {
                $scope.error = false;
                $scope.success = false;

                $scope.loading = true;
                $scope.resetPasswordBtnTxt = loadingBtnText;

                UserService.resetUserPassword($scope.identifier).then(() => {
                    $scope.loading = false;
                    $scope.resetPasswordBtnTxt = resetPasswordBtnText;

                    $scope.success = true;

                    $scope.$apply();
                }, (err) => {
                    $scope.loading = false;
                    $scope.resetPasswordBtnTxt = resetPasswordBtnText;

                    $scope.error = true;
                    $scope.errorMessage = err.message;

                    $scope.$apply();
                });
            };
        }]);
})();