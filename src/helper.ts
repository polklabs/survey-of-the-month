import fs from "fs";

export function hashCode(str: string): number {
  var hash = 0,
    i,
    chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

export async function checkFolderForUpdates(
  folderPath: string,
  lastCheckedTime: number
): Promise<string[]> {
  const files = await fs.promises.readdir(folderPath);
  const updatedFiles: string[] = [];

  for (const file of files) {
    const filePath = `${folderPath}/${file}`;
    const stats = await fs.promises.stat(filePath);
    if (stats.mtimeMs > lastCheckedTime) {
      updatedFiles.push(file);
    }
  }

  return updatedFiles;
}
