/**
 * Created by ericcarlton on 2/13/16.
 */
'use strict';

const mongo = require('mongodb').MongoClient;
const privateProperties = require('../config/privateProperties');
const appProperties = require('../config/appProperties');
const bunyan = require('bunyan');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const log = bunyan.createLogger({
    name: 'name-that-song',
    streams: [
        {
            level: appProperties.stdErrLvl,
            stream: process.stdout
        },
        {
            type: 'rotating-file',
            path: 'log/name-that-song-trace.log',
            level: 'trace',
            period: '1d',
            count: 7
        }
    ]
});

function insertUser(db, username, password, email) {
    log.trace({username: username}, 'Entered users.insertUser');

    const salt = new Date().getTime() + crypto.randomBytes(8).toString('hex');
    let sha512 = crypto.createHash('sha512');

    password = sha512.update(salt + password, 'utf8').digest('hex');

    return new Promise((resolve, reject) => {
        const collection = db.collection('users');

        collection.insertOne({
            username: username.toLowerCase(),
            password: password,
            email: email.toLowerCase(),
            salt: salt
        }).then((result) => {
            log.trace({
                username: username,
                result: result
            }, 'Created user successfully, resolving from users.insertUser');
            resolve(result);
        }, (err) => {
            log.error({
                error: err,
                username: username
            }, 'Error while creating user, rejecting from users.insertUser');
            reject({
                error: {
                    code: 1006,
                    message: appProperties.errorMessages['1006']
                }
            });
        });
    });
}

function getUser(db, query) {
    log.trace({query: query}, 'Entered users.getUser');

    return new Promise((resolve, reject) => {
        const collection = db.collection('users');

        collection.find(query).limit(1).next().then((doc) => {
            log.trace({user: doc}, 'User found, resolving from users.getUser');
            resolve(doc);
        }, (err) => {
            log.error({
                error: err,
                query: query
            }, 'Error while searching for user, rejecting from users.getUser');
            reject({
                error: {
                    code: 1006,
                    message: appProperties.errorMessages['1006']
                }
            });
        });
    });
}

function getUserByUsername(db, username) {
    log.trace({username: username}, 'Entered users.getUserByUsername');

    return new Promise((resolve, reject) => {
        getUser(db, {username: username.toLowerCase()}).then((user) => {
            log.trace({user: user}, 'User found, resolving from users.getUserByUsername');
            resolve(user);
        }, (err) => {
            log.trace({
                error: err,
                username: username
            }, 'Error while searching for user by username, rejecting from users.getUserByUsername');
            reject(err);
        });
    });
}

function getUserByEmail(db, email) {
    log.trace({email: email}, 'Entered users.getUserByEmail');

    return new Promise((resolve, reject) => {
        getUser(db, {email: email.toLowerCase()}).then((user) => {
            log.trace({user: user}, 'User found, resolving from users.getUserByEmail');
            resolve(user);
        }, (err) => {
            log.trace({
                error: err,
                email: email
            }, 'Error while searching for user by email, rejecting from users.getUserByEmail');
            reject(err);
        });
    });
}

function getUserByUsernameOrEmail(db, identifier) {
    log.trace({identifier: identifier}, 'Entered users.getUserByUsernameOrEmail');

    return new Promise((resolve, reject) => {
        getUserByUsername(db, identifier.toLowerCase()).then((user) => {
            if (user) {
                log.trace({user: user}, 'User found, resolving from users.getUserByUsernameOrEmail');
                resolve(user);
            } else {
                //failed to find user by username, try by email
                getUserByEmail(db, identifier.toLowerCase()).then((user) => {
                    if (user) {
                        log.trace({user: user}, 'User found, resolving from users.getUserByUsernameOrEmail');
                        resolve(user);
                    } else {
                        log.trace({identifier: identifier}, 'User not found, rejecting from users.getUserByUsernameOrEmail');
                        reject({
                            error: {
                                code: 1010,
                                message: appProperties.errorMessages['1010']
                            }
                        });
                    }
                }, (err) => {
                    log.trace({
                        error: err,
                        identifier: identifier
                    }, 'Error while search for user by email, rejecting from users.getUserByUsernameOrEmail');
                    reject(err);
                });
            }
        }, (err) => {
            log.trace({
                error: err,
                identifier: identifier
            }, 'Error while search for user by username, rejecting from users.getUserByUsernameOrEmail');
            reject(err);
        });
    });
}

function isUsernameUnique(db, username) {
    log.trace({username: username}, 'Entered users.isUsernameUnique');

    return new Promise((resolve, reject) => {
        getUserByUsername(db, username).then((user) => {
            if (user) {
                log.trace({username: username}, 'Username already registered, rejecting from users.isUsernameUnique');
                reject({
                    error: {
                        code: 1007,
                        message: appProperties.errorMessages['1007']
                    }
                });
            } else {
                log.trace({username: username}, 'Username unique, resolving from users.isUsernameUnique');
                resolve();
            }
        }, (err) => {
            log.trace({
                error: err,
                username: username
            }, 'Error while checking username uniqueness, rejecting from users.isUsernameUnique');
            reject(err);
        });
    });
}

function isEmailUnique(db, email){
    log.trace({email: email}, 'Entered users.isEmailUnique');

    return new Promise((resolve, reject) => {
        getUserByUsernameOrEmail(db, email).then((user) => {
            if (user) {
                log.trace({email: email}, 'Email already registered, rejecting from users.isEmailUnique');
                reject({
                    error: {
                        code: 1014,
                        message: appProperties.errorMessages['1014']
                    }
                });
            } else {
                log.trace({email: email}, 'Email unique, resolving from users.isEmailUnique');
                resolve();
            }
        }, (err) => {
            log.trace({
                error: err,
                email: email
            }, 'Error while checking email uniqueness, rejecting from users.isEmailUnique');
            reject(err);
        });
    });
}

function verifyLogin(db, username, password) {
    log.trace({username: username}, 'Entered users.verifyLogin');

    return new Promise((resolve, reject) => {
        getUserByUsername(db, username).then((user) => {
            if (user) {
                let sha512 = crypto.createHash('sha512');
                if (user.hasOwnProperty('password') && user.hasOwnProperty('salt') &&
                    user.password === sha512.update(user.salt + password, 'utf8').digest('hex')) {

                    log.trace({username: username}, 'Username/password combination found, resolving from users.verifyLogin');
                    resolve({
                        user: {
                            id: user._id
                        }
                    });
                } else {
                    log.trace({username: username}, 'Password incorrect for username, rejecting from users.verifyLogin');
                    reject({
                        error: {
                            code: 1009,
                            message: appProperties.errorMessages['1009']
                        }
                    });
                }
            } else {
                log.trace({username: username}, 'Username not found, rejecting from users.verifyLogin');
                reject({
                    error: {
                        code: 1008,
                        message: appProperties.errorMessages['1008']
                    }
                });
            }
        }, (err) => {
            log.trace({
                error: err,
                username: username
            }, 'Error while logging user in, rejecting from users.verifyLogin');
            reject(err);
        });
    });
}

function generatePasswordForUsername(username) {
    log.trace({username: username},'Entered users.generatePasswordForUsername');

    let sha512 = crypto.createHash('sha512');

    const plainTextPassword = crypto.randomBytes(8).toString('hex');

    let password = sha512.update('nameThatSong' + username + plainTextPassword, 'utf8').digest('hex');
    const salt = new Date().getTime() + crypto.randomBytes(8).toString('hex');


    sha512 = crypto.createHash('sha512');
    password = sha512.update(salt + password, 'utf8').digest('hex');

    return {
        salt: salt,
        hash: password,
        plainTextPassword: plainTextPassword
    };
}

function resetUserPassword(db, user) {
    log.trace({user: user}, 'Entered users.resetUserPassword');

    return new Promise((resolve, reject) => {
        if (user.email && user.email.length > 0) {
            const collection = db.collection('users');
            const password = generatePasswordForUsername(user.username);

            collection.updateOne({_id: user._id}, {
                $set: {
                    password: password.hash,
                    salt: password.salt
                }
            }).then(() => {
                resolve({user: user, password: password.plainTextPassword});
            }, (err) => {
                log.error({
                    error: err,
                    user: user
                }, 'Error while updating password, rejecting from users.resetUserPassword');
                reject({
                    error: {
                        code: 1006,
                        message: appProperties.errorMessages['1006']
                    }
                });
            });
        } else {
            log.trace({user: user}, 'User has no email address, rejecting form users.resetUserPassword');
            reject({
                error: {
                    code: 1013,
                    message: appProperties.errorMessages['1013']
                }
            });
        }
    });
}

function rollbackUserPassword(db, user) {
    return new Promise((resolve, reject) => {
        const collection = db.collection('users');

        collection.updateOne({_id: user._id}, {
            $set: {
                password: user.password,
                salt: user.salt
            }
        }).then(() => {
            log.trace({user: user}, 'User updated, resolving from users.rollbackUserPassword');
            resolve();
        }, (err) => {
            log.error({
                error: err,
                user: user
            }, 'Error while updating password, rejecting from users.rollbackUserPassword');
            reject({
                error: {
                    code: 1006,
                    message: appProperties.errorMessages['1006']
                }
            });
        });
    });
}

function emailUserNewPassword(username, email, password) {
    log.trace({email: email, username:username}, 'Entering users.emailUserNewPassword');
    const transporter = nodemailer.createTransport({
        service: privateProperties.emailService,
        auth: {
            user: privateProperties.emailUsername,
            pass: privateProperties.emailPassword
        }
    });

    const message = 'Your password for NameThatSong has been reset.\n\n' +
        'Username: ' + username + '\n' +
        'Password: ' + password + '\n\n' +
        'Please do not reply to this email as it comes from an unmonitored inbox.';

    const mailOptions = {
        from: privateProperties.emailUsername,
        to: email,
        subject: 'NameThatSong Password Reset',
        text: message
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions).then((info) => {
            log.trace({result: info, email: email}, 'Email sent, resolving from users.emailUseNewPassword');
            resolve();
        }, (err) => {
            log.error({
                error: err,
                email: mailOptions.to
            }, 'Unable to send email, rejecting from users.emailUseNewPassword');
            reject({
                error: {
                    code: 1011,
                    message: appProperties.errorMessages['1011']
                }
            });
        });
    });
}


module.exports = {
    createUser: (username, password, email) => {
        log.trace({username: username}, 'Entered users.createUser');

        return new Promise((resolve, reject) => {
            mongo.connect(privateProperties.mongoUrl, (err, db) => {
                if (err) {
                    log.error({error: err}, 'Error with db connection, rejecting from users.createUser');
                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                } else {
                    isUsernameUnique(db, username).then(() => {
                        if(email && email.length > 0){
                            isEmailUnique(db, email).then(() => {
                                insertUser(db, username, password, email).then((result) => {
                                    db.close();

                                    log.trace({
                                        username: username,
                                        result: result
                                    }, 'Created user successfully, resolving from users.createUser');
                                    resolve(result);
                                }, (err) => {
                                    db.close();

                                    log.trace({
                                        error: err,
                                        username: username
                                    }, 'Error while creating user, rejecting from users.createUser');
                                    reject(err);
                                });
                            }, (err) => {
                                db.close();

                                log.trace({username: username}, 'Email already registered, rejecting from users.createUser');
                                reject(err);
                            });
                        } else {
                            insertUser(db, username, password, email).then((result) => {
                                db.close();

                                log.trace({
                                    username: username,
                                    result: result
                                }, 'Created user successfully, resolving from users.createUser');
                                resolve(result);
                            }, (err) => {
                                db.close();

                                log.trace({
                                    error: err,
                                    username: username
                                }, 'Error while creating user, rejecting from users.createUser');
                                reject(err);
                            });
                        }
                    }, (err) => {
                        db.close();

                        log.trace({username: username}, 'Username already registered, rejecting from users.createUser');
                        reject(err);
                    });
                }
            });
        });
    },

    checkUsernameAvailable: (username) => {
        return new Promise((resolve, reject) => {
            mongo.connect(privateProperties.mongoUrl, (err, db) => {
                if (err) {
                    log.error({error: err}, 'Error with db connection, rejecting from users.checkUsernameAvailable');
                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                } else {
                    isUsernameUnique(db, username).then(() => {
                        db.close();

                        log.trace({username: username}, 'Username available, resolving from users.checkUsernameAvailable');
                        resolve();
                    }, (err) => {
                        db.close();

                        log.trace({username: username}, 'Username not available, rejecting from users.checkUsernameAvailable');
                        reject(err);
                    });
                }
            });
        });
    },

    loginUser: (username, password) => {
        return new Promise((resolve, reject) => {
            mongo.connect(privateProperties.mongoUrl, (err, db) => {
                if (err) {
                    log.error({error: err}, 'Error with db connection, rejecting from users.loginUser');
                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                } else {
                    verifyLogin(db, username, password).then((user) => {
                        db.close();

                        log.trace({username: username}, 'Username/password combination found, resolving from users.loginUser');
                        resolve(user);
                    }, (err) => {
                        db.close();

                        log.trace({username: username}, 'Username/password combination not found, rejecting from users.loginUser');
                        reject(err);
                    });
                }
            });
        });
    },

    resetPassword: (identifier) => {
        return new Promise((resolve, reject) => {
            mongo.connect(privateProperties.mongoUrl, (err, db) => {
                if (err) {
                    log.error({error: err}, 'Error with db connection, rejecting from users.loginUser');
                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                } else {
                    getUserByUsernameOrEmail(db, identifier).then((user) => {
                        resetUserPassword(db, user).then((result) => {
                            emailUserNewPassword(result.user.username, result.user.email, result.password).then(() => {
                                db.close();

                                log.trace({username: result.user.username}, 'Email sent, resolving from users.resetPassword');
                                resolve();
                            }, (err) => {
                                log.trace({username: result.user.username}, 'Email not sent, attempting to rollback password');
                                rollbackUserPassword(db, user).then(() => {
                                    db.close();

                                    err.error.message += '. Password reset has been undone';
                                    reject(err);
                                }, () => {
                                    db.close();

                                    err.error.message += '. Password reset could not be undone';
                                    reject(err);
                                });
                            });
                        }, (err) => {
                            db.close();

                            log.trace({
                                error: err,
                                user: user
                            }, 'Error while updating user, rejecting from users.resetPassword');
                            reject(err);
                        });
                    }, (err) => {
                        db.close();

                        log.trace({identifier: identifier}, 'User not found, rejecting from users.resetPassword');
                        reject(err);
                    });
                }
            });
        });
    }
};