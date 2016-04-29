/**
 * Created by ericcarlton on 4/27/16.
 */
"use strict";

const privateProperties = require('../config/privateProperties');
const Collection = require('./Collection');
const passwords = new Collection('users');
const users = require('./users');
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

/**
 * Attempts to retrieve a user from the db by either username or _id. Returns a promise that resolves with the user retrieved.
 * @param identifier    -   the username or _id value of the user to search for.
 * @returns {Promise}   -   If the operation was a success, resolves with the user found ( even if that value is null ).
 *                          Otherwise, rejects with an error.
 */
function getUserByUsernameOrEmail(identifier) {
    log.trace({identifier: identifier}, 'Entered passwords.getUserByUsernameOrEmail');

    return new Promise((resolve, reject) => {
        //try to find user by username
        passwords.getDocument({username: identifier.toLowerCase()}).then((user) => {
            if (user) {
                log.trace({username: user.username}, 'User found, resolving from passwords.getUserByUsernameOrEmail');
                resolve(user);
            } else {
                //failed to find user by username, try by email
                passwords.getDocument({email: identifier.toLowerCase()}).then((user) => {
                    if (user) {
                        log.trace({username: user.username}, 'User found, resolving from passwords.getUserByUsernameOrEmail');
                    } else {
                        log.trace({identifier: identifier}, 'User not found, resolving from passwords.getUserByUsernameOrEmail with null');
                    }

                    resolve(user);
                }, (err) => {
                    //an error occurred while searching for user by email
                    log.trace({
                        error: err,
                        identifier: identifier
                    }, 'Error while searching for user by email, rejecting from passwords.getUserByUsernameOrEmail');

                    reject(err);
                });
            }
        }, (err) => {
            //an error occurred while searching for user by username
            log.trace({
                error: err,
                identifier: identifier
            }, 'Error while searching for user by username, rejecting from passwords.getUserByUsernameOrEmail');
            reject(err);
        });
    });
}

/**
 * Generates a salt and sha512 hash for the username and password provided.
 * @param username                  -   The username of the user to generate a password hash for.
 * @param password                  -   The password of the user to generate a password hash for.
 * @returns {{salt: *, hash: *}}    -   The salt property is the salt used to create the password hash.
 *                                      The hash property is the result of salting and hashing for the username and
 *                                      password given.
 */
function generatePasswordHashForUsername(username, password) {
    log.trace({username: username}, 'Entered passwords.generatePasswordHashForUsername');

    const salt = new Date().getTime() + crypto.randomBytes(8).toString('hex');
    const hash = crypto.createHash('sha512').update(salt + password, 'utf8').digest('hex');

    log.trace({username: username}, 'Password hash has been generated, exiting passwords.generatePasswordHashForUsername');
    return {
        salt: salt,
        hash: hash
    };
}

/**
 * Updates the given user's salt and hash value to the salt and hash value in the given password object. Returns a
 * promise that resolves with the updated user.
 * @param user          -   User object to be updated in the database.
 * @param password      -   Object with hash property that will be set to the user's new hash value and
 *                          salt property that will be set to the user's new salt value.
 * @returns {Promise}   -   If the operation was a success, resolves with the user whose password was changed.
 *                          Otherwise, rejects with an error.
 */
function changeUserPassword(user, password) {
    log.trace({username: user.username}, 'Entered passwords.changeUserPassword');

    user.password = password.hash;
    user.salt = password.salt;

    return new Promise((resolve, reject) => {
        passwords.updateDocument(user, {_id: user._id}).then((result) => {
            log.trace({username: user.username}, 'Password changed for user, resolving from passwords.changeUserPassword');
            resolve({user: result});
        }, (err) => {
            log.error({
                error: err,
                user: user
            }, 'Error while updating password, rejecting from passwords.changeUserPassword');
            reject({
                error: {
                    code: 1006,
                    message: appProperties.errorMessages['1006']
                }
            });
        });
    });
}

/**
 * Creates a new password for a user and updates it in the database.
 * @param user          -   The user whose password needs to be reset.
 * @returns {Promise}   -   If the operation was a success, resolves with the user whose password was changed.
 *                          Otherwise, rejects with an error.
 */
function resetUserPassword(user) {
    log.trace({username: user.username}, 'Entered passwords.resetUserPassword');

    return new Promise((resolve, reject) => {
        if (user.email && user.email.length > 0) {
            const plainTextPassword = crypto.randomBytes(8).toString('hex');

            const password = generatePasswordHashForUsername(user.username, crypto.createHash('sha512').update('nameThatSong' + user.username + plainTextPassword, 'utf8').digest('hex'));

            changeUserPassword(user, password).then((result) => {
                log.trace({username: user.username}, 'Password reset successful for user.  Resolving form passwords.resetUserPassword');
                result.password = plainTextPassword;
                resolve(result);
            }, (err) => {
                log.trace({username: user.username}, 'Error resetting password, rejecting from passwords.resetUserPassword');
                reject(err);
            });
        } else {
            log.trace({username: user.username}, 'User has no email address, rejecting from passwords.resetUserPassword');
            reject({
                error: {
                    code: 1013,
                    message: appProperties.errorMessages['1013']
                }
            });
        }
    });
}

/**
 * Used to reset a user's password to it's original value if the notification email fails to send on a password reset.
 * Returns a promise that resolves with the updated user.
 * @param user          -   User who needs its password rolled back.
 * @returns {Promise}   -   If the operation was a success, resolves with the user whose password was changed.
 *                          Otherwise, rejects with an error.
 */
function rollbackUserPassword(user) {
    return new Promise((resolve, reject) => {
        passwords.updateDocument(user, {_id: user._id}).then((result) => {
            log.trace({username: result.username}, 'User updated, resolving from passwords.rollbackUserPassword');
            resolve(result);
        }, (err) => {
            log.error({
                error: err,
                user: user
            }, 'Error while updating password, rejecting from passwords.rollbackUserPassword');
            reject({
                error: {
                    code: 1006,
                    message: appProperties.errorMessages['1006']
                }
            });
        });
    });
}

/**
 * Emails user's new password to the email address provided.
 * @param username      -   The username of the user to email.
 * @param email         -   The email address of the user.
 * @param password      -   The password to include in the email.
 * @returns {Promise}   -   If the operation was a success, resolves with null.
 *                          Otherwise, resolves with an error.
 */
function emailUserNewPassword(username, email, password) {
    log.trace({email: email, username: username}, 'Entering passwords.emailUserNewPassword');
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
            log.trace({result: info, email: email}, 'Email sent, resolving from passwords.emailUseNewPassword');
            resolve();
        }, (err) => {
            log.error({
                error: err,
                email: mailOptions.to
            }, 'Unable to send email, rejecting from passwords.emailUseNewPassword');
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
    /**
     * Updates the user in the users collection with the given username and password to the the new password given.
     * @param username      -   The username of the user to update.
     * @param oldPassword   -   The current password of the user to update.
     * @param newPassword   -   The new password for the user.
     * @returns {Promise}   -   If the operation was successful and a user was found, resolves to the user that was updated,
     *                          omitting the password and salt properties.  If a user was not found with the give username/
     *                          password combination, resolves with an error.
     *                          If the operation was not successful, rejects with an error.
     */
    changePassword: (username, oldPassword, newPassword) => {
        return new Promise((resolve, reject) => {
            users.loginUser(username.toLowerCase(), oldPassword).then((login) => {
                if (login.error) {
                    log.trace({username: username}, 'Username/password combination not found, resolving from passwords.changePassword');
                    resolve(login);
                } else {
                    const password = generatePasswordHashForUsername(login.user.username, newPassword);

                    changeUserPassword(login.user, password).then((result) => {
                        log.trace({username: result.user.username}, "Resolving from passwords.changePassword");

                        delete result.user.password;
                        delete result.user.salt;

                        resolve(result);
                    }, (err) => {
                        log.trace({username: login.user.username}, 'Error changing user\'s password, rejecting from passwords.changePassword');
                        reject(err);
                    });
                }

            }, (err) => {
                log.trace({username: username}, 'An error occurred while checking username/password combination, rejecting from passwords.changePassword');
                reject(err);
            });
        });
    },

    /**
     * Attempts to find a user with a username or email property matching the identifier given. If a user is found and 
     * has an email property that is not null, generates a random password and emails it to the email address associated
     * with the user.  If the email fails to send, the user's password is rolled back to its original value. Resolves
     * with null.
     * @param identifier    -   The email address or username for the user who needs a password reset.
     * @returns {Promise}   -   If the operation was successful, resolves with null.
     *                          If the operation was not successful, rejects with an error.
     */
    resetPassword: (identifier) => {
        return new Promise((resolve, reject) => {
            getUserByUsernameOrEmail(identifier).then((user) => {
                if (user) {
                    resetUserPassword(user).then((result) => {
                        emailUserNewPassword(result.user.username, result.user.email, result.password).then(() => {
                            log.trace({username: result.user.username}, 'Email sent, resolving from passwords.resetPassword');
                            resolve();
                        }, (err) => {
                            log.trace({username: result.user.username}, 'Email not sent, attempting to rollback password');
                            rollbackUserPassword(user).then(() => {
                                err.error.message += '. Password reset has been undone';
                                reject(err);
                            }, () => {
                                err.error.message += '. Password reset could not be undone';
                                reject(err);
                            });
                        });
                    }, (err) => {
                        log.trace({
                            error: err,
                            user: user
                        }, 'Error while updating user, rejecting from passwords.resetPassword');
                        reject(err);
                    });
                } else {
                    reject({
                        error: {
                            code: 1010,
                            message: appProperties.errorMessages['1010']
                        }
                    });
                }

            }, (err) => {
                log.trace({identifier: identifier}, 'User not found, rejecting from passwords.resetPassword');
                reject(err);
            });
        });
    }
};