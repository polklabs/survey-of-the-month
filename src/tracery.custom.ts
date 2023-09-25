import { holidays, months } from "./tracery.const";
var Holidays = require("date-holidays");

const cache: { [key: string]: { value: string; lastUpdated: Date } } = {};

function loadFromCache(key: string, asOf: Date): string | undefined {
  const c = cache[key];
  if (c === undefined) {
    return undefined;
  }
  const cacheDate = c.lastUpdated.toDateString();
  if (asOf.toDateString() === cacheDate) {
    return c.value;
  }
  return undefined;
}

function addToCache(key: string, value: string, asOf: Date): void {
  cache[key] = { value, lastUpdated: asOf };
}

export function monthNow(asOf = new Date()): string[] {
  let c = loadFromCache("monthNow", asOf);
  if (c !== undefined) {
    return [c];
  }
  c = months[asOf.getMonth()];
  addToCache("monthNow", c, asOf);
  return [c];
}

export function yearNow(asOf = new Date()): string[] {
  let c = loadFromCache("yearNow", asOf);
  if (c !== undefined) {
    return [c];
  }
  c = asOf.getFullYear().toString();
  addToCache("yearNow", c, asOf);
  return [c];
}

export function nextHoliday(asOf = new Date()): string[] {
  let c = loadFromCache("nextHoliday", asOf);
  if (c !== undefined) {
    return [c];
  }
  c = getNextHoliday(asOf.getFullYear(), asOf.getTime()); 
  addToCache("nextHoliday", c, asOf);
  return [c];
}

function getNextHoliday(year: number, time: number): string {
  let next = "";
  let nextDate = new Date();
  nextDate.setFullYear(nextDate.getFullYear() + 1);
  const hd = new Holidays("US");
  const h = hd.getHolidays(year);
  h.filter((x) => Object.keys(holidays).includes(x.name)).forEach((holiday) => {
    const d = new Date(holiday.date);
    if (d.getTime() >= time && d.getTime() < nextDate.getTime()) {
      nextDate = d;
      if(holidays[holiday.name] === '') {
        next = holiday.name;
      } else {
        next = holidays[holiday.name];
      }
    }
  });
  return next;
}
