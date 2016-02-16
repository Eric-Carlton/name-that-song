/**
 * Created by ericcarlton on 12/7/15.
 */
module.exports = {
    echonestFormat: 'json',
    echonestResults: 200,
    echonestType: 'artist-radio',
    port: 8008,
    errorMessages: {
        1000: 'No songs found for artist. Please choose another artist and try again.',
        1001: 'No playlist generated.  Please generate a playlist before requesting a song.',
        1002: 'No songs left in playlist.  Please generate a new playlist.',
        1003: 'Unable to find preview track for song.  Please request a new song.',
        1004: 'No username in request',
        1005: 'No password in request',
        1006: 'Database error',
        1007: 'Username already registered',
        1008: 'Username does not exist',
        1009: 'Password incorrect',
        1010: 'No account found for that username or email',
        1011: 'Error sending email',
        1012: 'Identifier required to reset password',
        1013: 'Unable to reset password because user has no associated email address',
        1014: 'Account with email address already registered'
    },
    stdErrLvl: 'trace'
};