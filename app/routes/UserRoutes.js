/**
 * Created by ericcarlton on 4/28/16.
 */
"use strict";

const bunyan = require('bunyan');
const appProperties = require('../config/appProperties');
const users = require('../utils/users');
const passwords = require('../utils/passwords');

const log = bunyan.createLogger({
    name: 'name-that-song',
    streams: [
        {
            level: appProperties.stdErrLvl,
            stream: process.stdout
        },
        {
            type: 'rotating-file',
            path: 'log/api-trace.log',
            level: 'trace',
            period: '1d',
            count: 7
        }
    ]
});

class UserRoutes {
    /**
     * Sets this.server.
     * @param server    -   A restify server.
     */
    constructor(server) {
        this.server = server;
    }
    
    createRoutes() {
        this.server.post('/api/user/create', (req, res, next) => {
            log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'Request to /user/create');

            if (req.params.hasOwnProperty('username')) {
                if (req.params.hasOwnProperty('password')) {
                    users.createUser(req.params.username, req.params.password, req.params.email).then((result) => {
                        log.debug({response: result}, 'Sending response from /user/create');

                        if (result.error) {
                            res.send(500, result);
                            return next();
                        } else {
                            res.send(201, result);
                            return next();
                        }

                    }, (err) => {
                        log.debug({response: err}, 'Sending response from /user/create');

                        res.send(500, err);
                        return next();
                    });
                } else {
                    const response = {
                        error: {
                            code: 1005,
                            message: appProperties.errorMessages['1005']
                        }
                    };

                    log.debug({response: response}, 'Sending response from /user/create');

                    res.send(500, response);
                    return next();
                }

            } else {
                const response = {
                    error: {
                        code: 1004,
                        message: appProperties.errorMessages['1004']
                    }
                };

                log.debug({response: response}, 'Sending response from /user/create');

                res.send(500, response);
                return next();
            }
        });

        this.server.post('/api/user/login', (req, res, next) => {
            log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'Request to /user/login');

            if (req.params.hasOwnProperty('username')) {
                if (req.params.hasOwnProperty('password')) {
                    users.loginUser(req.params.username, req.params.password).then((result) => {
                        if (result.error) {
                            log.debug({response: {error: result.error}}, 'Sending response from /user/login');

                            res.send(500, {error: result.error});
                            return next();
                        } else {
                            log.debug({response: {user: result.user}}, 'Sending response from /user/login');

                            res.send(200, {user: result.user});
                            return next();
                        }

                    }, (err) => {
                        log.debug({response: err}, 'Sending response from /user/login');

                        res.send(500, err);
                        return next();
                    });
                } else {
                    const response = {
                        error: {
                            code: 1005,
                            message: appProperties.errorMessages['1005']
                        }
                    };

                    log.debug({response: response}, 'Sending response from /user/login');

                    res.send(400, response);
                    return next();
                }

            } else {
                const response = {
                    error: {
                        code: 1004,
                        message: appProperties.errorMessages['1004']
                    }
                };

                log.debug({response: response}, 'Sending response from /user/login');

                res.send(400, response);
                return next();
            }
        });

        this.server.get('/api/user/available/:username', (req, res, next) => {
            log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'Request to /user/available/:username');

            users.checkUsernameAvailable(req.params.username).then((isAvailable) => {
                const response = {
                    isAvailable: isAvailable
                };
                log.debug({response: response}, 'Sending response from /user/available/:username');


                res.send(200, response);
                return next();
            }, (err) => {
                log.debug({response: err}, 'Sending response from /user/available/:username');

                res.send(500, err);
                return next();
            });
        });

        this.server.post('/api/user/password/reset', (req, res, next) => {
            log.debug({params: req.params, ipAddress: req.connection.remoteAddress}, 'Request to /user/password/reset');

            if (req.params.hasOwnProperty('identifier')) {
                passwords.resetPassword(req.params.identifier).then(() => {
                    log.debug({response: 204}, 'Sending response from /user/password/reset');

                    res.send(204);
                    return next();
                }, (err) => {
                    log.debug({response: err}, 'Sending response from /user/password/reset');

                    res.send(500, err);
                    return next();
                });
            } else {
                const response = {
                    error: {
                        code: 1012,
                        message: appProperties.errorMessages['1012']
                    }
                };

                log.debug({response: response}, 'Sending response from /user/password/reset');

                res.send(400, response);
                return next();
            }
        });

        this.server.put('/api/user/password/change', (req, res, next) => {
            log.debug({
                identifier: req.params.username,
                ipAddress: req.connection.remoteAddress
            }, 'Request to /user/password/change');

            if (req.params.hasOwnProperty('username')) {
                if (req.params.hasOwnProperty('newPassword')) {
                    if (req.params.hasOwnProperty('password')) {

                        passwords.changePassword(req.params.username, req.params.password, req.params.newPassword).then((result) => {
                            if (result.error) {
                                log.debug({response: result}, 'Sending response from /user/password/change');

                                res.send(500, result);
                                return next();
                            } else {
                                log.debug({response: result}, 'Sending response from /user/password/change');

                                res.send(200, result);
                                return next();
                            }

                        }, (err) => {
                            log.debug({response: err}, 'Sending response from /user/password/change');

                            res.send(500, err);
                            return next();
                        });
                    } else {
                        const response = {
                            error: {
                                code: 1005,
                                message: appProperties.errorMessages['1005']
                            }
                        };

                        log.debug({response: response}, 'Sending response from /user/password/change');

                        res.send(400, response);
                        return next();
                    }
                } else {
                    const response = {
                        error: {
                            code: 1015,
                            message: appProperties.errorMessages['1015']
                        }
                    };

                    log.debug({response: response}, 'Sending response from /user/password/change');

                    res.send(400, response);
                    return next();
                }
            } else {
                const response = {
                    error: {
                        code: 1004,
                        message: appProperties.errorMessages['1004']
                    }
                };

                log.debug({response: response}, 'Sending response from /user/password/change');

                res.send(400, response);
                return next();
            }
        });
    }
}

module.exports = UserRoutes;