import fs from 'fs';
import json_minify from 'node-json-minify';

export let mods: { [key: string]: string } = {};

export function reloadModData() {
    mods = {};
    loadMod('customMod.jsonc');
}

// Load multiple grammar files and merge them
export function loadMod(filename: string) {
    const modTemp = JSON.parse(json_minify(fs.readFileSync(`./data/${filename}`,
        { encoding: 'utf8', flag: 'r' })));

    const keys = Object.keys(modTemp);
    keys.forEach(key => {
        mods[key] = modTemp[key];
    });

    console.log(`Loaded ${keys.length} custom mods`);
}

export function getCustomMod(id: string): string | null {
    if (mods[id] !== undefined) {
        return mods[id];
    }
    return null;
}