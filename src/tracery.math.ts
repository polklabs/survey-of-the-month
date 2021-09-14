var seedrandom = require('seedrandom');

export function setSeed(seed = ''): [any, string] {
    if (seed === undefined || seed === '') {
        seed = seedrandom().int32().toString();
        return [seedrandom(seed), seed];
    } else {
        return [seedrandom(seed), seed];
    }
}

export function randomNext(minValue: number, maxValue: number, rng: any): number {
    return Math.floor((rng() * (maxValue - minValue)) + minValue);
}

export function roundUp(numToRound: number, multiple = 0): number {
    if (multiple === 0) return numToRound;

    const remainder = Math.abs(numToRound) % multiple;
    if (remainder === 0) numToRound;

    if (numToRound < 0) {
        return -(Math.abs(numToRound) - remainder);
    } else {
        return numToRound + multiple - remainder;
    }
}
