// lib/shareFiles.js
// Reads a file out of a folder on the SAP-Attachments network share
// (\\172.50.10.9\SAP-Attachments\...). Same three-way access strategy as
// pages/api/coa/download/[coaFilename].js: UNC path directly on Windows; on
// Linux a CIFS mount at /mnt/172.50.10.9/... first, then smbclient using
// NETWORK_USERNAME / NETWORK_PASSWORD from the environment (no defaults).

import fs from "fs";
import path from "path";
import { promisify } from "util";
import { execFile } from "child_process";

const execFilePromise = promisify(execFile);

export const MSDS_SHARE_PATH = process.env.MSDS_BASE_PATH || "\\\\172.50.10.9\\SAP-Attachments\\MSDS";

// Split "\\host\share\folder" into the pieces smbclient needs.
const parseUnc = (basePath) => {
  const parts = basePath.replace(/^\\\\/, "").split("\\").filter(Boolean);
  return { host: parts[0], share: parts[1], folder: parts.slice(2).join("/") };
};

// Returns { buffer } on success, or null when the file isn't reachable.
// `fileName` comes from a DB row, but is reduced to its basename anyway so it
// can never point outside the folder.
export const readShareFile = async (basePath, fileName) => {
  if (!fileName) return null;
  const safeName = path.basename(String(fileName).replace(/\\/g, "/")).trim();
  if (!safeName) return null;

  if (process.platform === "win32") {
    try {
      return { buffer: await fs.promises.readFile(path.join(basePath, safeName)) };
    } catch (err) {
      console.error("[shareFiles] Windows read failed:", err.code || err.message);
      return null;
    }
  }

  const mounted = path.join(basePath.replace("\\\\", "/mnt/").replace(/\\/g, "/"), safeName);
  try {
    return { buffer: await fs.promises.readFile(mounted) };
  } catch (err) {
    console.log("[shareFiles] mounted path failed, trying smbclient:", err.code || err.message);
  }

  try {
    const username = process.env.NETWORK_USERNAME;
    const password = process.env.NETWORK_PASSWORD;
    if (!username || !password) {
      throw new Error("NETWORK_USERNAME / NETWORK_PASSWORD are not configured");
    }
    // ';' and '!' are smbclient command syntax inside its -c string.
    if (/[;$`"!\r\n]/.test(safeName)) {
      throw new Error("File name contains characters not allowed for the SMB fallback");
    }
    const { host, share, folder } = parseUnc(basePath);
    const tempFilePath = `/tmp/share_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`;
    await execFilePromise("smbclient", [
      `//${host}/${share}`,
      "-U", `${username}%${password}`,
      "-c", `cd "${folder}"; get "${safeName}" "${tempFilePath}"`,
    ]);
    const buffer = await fs.promises.readFile(tempFilePath);
    fs.promises.unlink(tempFilePath).catch(() => {});
    return { buffer };
  } catch (err) {
    console.error("[shareFiles] smbclient read failed:", err.message);
    return null;
  }
};
