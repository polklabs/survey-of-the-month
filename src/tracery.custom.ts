import { holidays, months } from "./tracery.const";
var Holidays = require("date-holidays");

const cache: { [key: string]: { value: string; lastUpdated: Date } } = {};

function loadFromCache(key: string): string | undefined {
  const c = cache[key];
  if (c === undefined) {
    return undefined;
  }
  const today = new Date().toDateString();
  const cacheDate = c.lastUpdated.toDateString();
  if (today === cacheDate) {
    return c.value;
  }
  return undefined;
}

function addToCache(key: string, value: string): void {
  cache[key] = { value, lastUpdated: new Date() };
}

export function monthNow(): string[] {
  let c = loadFromCache("monthNow");
  if (c !== undefined) {
    return [c];
  }
  c = months[new Date().getMonth()];
  addToCache("monthNow", c);
  return [c];
}

export function yearNow(): string[] {
  let c = loadFromCache("yearNow");
  if (c !== undefined) {
    return [c];
  }
  c = new Date().getFullYear().toString();
  addToCache("yearNow", c);
  return [c];
}

export function nextHoliday(): string[] {
  let c = loadFromCache("nextHoliday");
  if (c !== undefined) {
    return [c];
  }
  const asOf = new Date();
  c = getNextHoliday(asOf.getFullYear(), asOf.getTime());
  if (c === "") {
    c = getNextHoliday(asOf.getFullYear() + 1, asOf.getTime());
  } 
  addToCache("nextHoliday", c);
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
