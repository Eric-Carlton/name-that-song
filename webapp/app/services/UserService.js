/**
 * Created by ericcarlton on 2/13/16.
 */
'use strict';

(function () {
    const serviceProperties = require('../config/serviceProperties.json');
    const crypto = require('crypto-browserify');

    function encryptPassword(username, password) {
        let sha512 = crypto.createHash('sha512');
        return sha512.update('nameThatSong' + username.toUpperCase() + password, 'utf8').digest('hex');
    }

    angular.module('nameThatSong.user', []).service('UserService', ['$http', function ($http) {
        const _this = this;

        this.user = {};

        this.loginUser = (username, password) => {
            password = encryptPassword(username, password);
            return new Promise((resolve, reject) => {
                $http({
                    method: 'POST',
                    data: {username: username.toUpperCase(), password: password},
                    url: serviceProperties.host + serviceProperties.loginRoute,
                    timeout: serviceProperties.timeout
                }).then((res) => {
                    _this.user = res.data.user;
                    resolve();
                }, (err) => {
                    if (err && err.hasOwnProperty('data') && err.data && err.data.hasOwnProperty('error') &&
                        err.data.error && err.data.error.hasOwnProperty('message') && err.data.error.message &&
                        err.data.error.hasOwnProperty('code') && err.data.error.code) {
                        reject(err.data.error);
                    } else {
                        reject({
                            code: '0000',
                            message: 'Unable to send login request. Please check internet connection and try again.'
                        });
                    }
                });
            });
        };

        this.isUsernameAvailable = (username) =>{
            return new Promise((resolve, reject) => {
                $http({
                    method: 'GET',
                    url: serviceProperties.host + serviceProperties.usernameAvailableRoute + username.toUpperCase(),
                    timeout: serviceProperties.timeout
                }).then(() => {
                    resolve();
                }, (err) => {
                    if (err && err.hasOwnProperty('data') && err.data && err.data.hasOwnProperty('error') &&
                        err.data.error && err.data.error.hasOwnProperty('message') && err.data.error.message &&
                        err.data.error.hasOwnProperty('code') && err.data.error.code) {
                        reject(err.data.error);
                    } else {
                        reject({
                            code: '0000',
                            message: 'Unable to send login request. Please check internet connection and try again.'
                        });
                    }
                });
            });
        };

        this.registerUser = (username, password, email) => {
            password = encryptPassword(username, password);
            return new Promise((resolve, reject) => {
                $http({
                    method: 'POST',
                    data: {username: username.toUpperCase(), password: password, email: email},
                    url: serviceProperties.host + serviceProperties.registerRoute,
                    timeout: serviceProperties.timeout
                }).then(() => {
                    resolve();
                }, (err) => {
                    if (err && err.hasOwnProperty('data') && err.data && err.data.hasOwnProperty('error') &&
                        err.data.error && err.data.error.hasOwnProperty('message') && err.data.error.message &&
                        err.data.error.hasOwnProperty('code') && err.data.error.code) {
                        reject(err.data.error);
                    } else {
                        reject({
                            code: '0000',
                            message: 'Unable to send login request. Please check internet connection and try again.'
                        });
                    }
                });
            });
        };
    }]);
})();