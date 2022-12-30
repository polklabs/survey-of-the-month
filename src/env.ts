import { env } from "node:process";
import fs from "fs";

export function GetEnvString(name: string, defaultValue?: string): string {
    return GetEnvironmentVar(name, defaultValue);
}

export function GetEnvInt(name: string, defaultValue?: number): number {
    return Number.parseInt(GetEnvironmentVar(name, defaultValue?.toString()), 10);
}

export function GetEnvFloat(name: string, defaultValue?: number): number {
    return Number.parseFloat(GetEnvironmentVar(name, defaultValue?.toString()));
}

export function GetEnvBool(name: string, defaultValue?: boolean): boolean {
    const trueValues = ['1', 'true', 't', 'yes'];
    return trueValues.includes(GetEnvironmentVar(name, defaultValue ? 'true' : 'false').toLowerCase());
}

function GetEnvironmentVar(name: string, defaultValue?: string): string {
    const isDocker = env.IS_DOCKER || "false";
    let value: string | undefined = undefined;
    if (isDocker === "true") {
        value = env[name];
    } else {
        value = GetFromConfig(name)
    }
    if (value === undefined && defaultValue === undefined) {
        throw new Error(`Environment Variable ${name} is undefined`);
    }
    return value ?? defaultValue ?? '';
}

function GetFromConfig(name: string): string {
    const settings = JSON.parse(
        fs.readFileSync(`./localConfig.json`, { encoding: "utf8", flag: "r" })
    );
    return settings[name];
}
