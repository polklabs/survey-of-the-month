var seedrandom = require('seedrandom');

function setSeed(seed = '') {
    if (seed === undefined || seed === '') {
        seed = seedrandom().int32().toString();
        return [seedrandom(seed), seed];
    } else {
        return [seedrandom(seed), seed];
    }
}

function randomNext(minValue, maxValue, rng) {
    return Math.floor((rng() * (maxValue - minValue)) + minValue);
}

function roundUp(numToRound, multiple = 0) {
    if (multiple === 0) return numToRound;

    const remainder = Math.abs(numToRound) % multiple;
    if (remainder === 0) numToRound;

    if (numToRound < 0) {
        return -(Math.abs(numToRound) - remainder);
    } else {
        return numToRound + multiple - remainder;
    }
}

module.exports.randomNext = randomNext;
module.exports.roundUp = roundUp;
module.exports.setSeed = setSeed;