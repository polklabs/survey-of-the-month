function randomNext(minValue, maxValue) {
    return Math.floor((Math.random() * (maxValue - minValue)) + minValue);
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