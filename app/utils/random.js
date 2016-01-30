/**
 * Created by ericcarlton on 12/7/15.
 */
'use strict';
module.exports = {
    /**
     * Randomly selects an integer between low and high, inclusive
     * @param low - low end of random range
     * @param high - high end of random range
     * @returns {number} - random integer between low and high, inclusive
     */
    randomIntInc: (low, high) => {
        return Math.floor(Math.random() * (high - low + 1) + low);
    }
};