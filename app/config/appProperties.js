/**
 * Created by ericcarlton on 12/7/15.
 */
module.exports = {
    echonestFormat: 'json',
    echonestResults: 200,
    echonestType: 'artist-radio',
    serverPort: 8008,
    socketPort: 8009,
    errorMessages: {
        1000: 'No songs found for artist. Please choose another artist and try again',
        1001: 'No playlist generated.  Please generate a playlist before requesting a song',
        1002: 'No songs left in playlist.  Please generate a new playlist',
        1003: 'Unable to find preview track for song.  Please request a new song',
        1004: 'No username in request',
        1005: 'No password in request',
        1006: 'Database error',
        1007: 'Username already registered',
        1008: 'Username does not exist',
        1009: 'Password incorrect',
        1010: 'No account found for that username or email',
        1011: 'Error sending email',
        1012: 'No identifier in request',
        1013: 'Unable to reset password because user has no associated email address',
        1014: 'Account with email address already registered',
        1015: 'No newPassword in request',
        1016: 'No artist in request',
        1017: 'No user in request',
        1018: 'No user.username in request',
        1019: 'No user._id in request',
        1020: 'No operation in request',
        1021: 'Only operation values of \'join\' or \'leave\' are permitted',
        1022: 'Room does not exist',
        1023: 'User does not exist'
    },
    stdErrLvl: 'trace'
};