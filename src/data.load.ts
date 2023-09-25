import { checkFolderForUpdates } from "./helper";
import { reloadModData } from "./mod.load";
import { reloadTraceryData } from "./tracery.load";

let lastCheckedTime = Date.now();

export function init() {
  reloadModData();
  reloadTraceryData();
}

export async function dataCheck() {
  const updatedFiles = await checkFolderForUpdates("./data/", lastCheckedTime);
  if (updatedFiles.length > 0) {
    console.log(`Updated files: ${updatedFiles.join(", ")}`);
    // Load Data
    init();
  }
  lastCheckedTime = Date.now();
}
