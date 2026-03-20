import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getHWID() {
  try {
    // Native Windows command to get unique UUID
    const output = execSync('wmic csproduct get uuid').toString();
    return output.split('\n')[1].trim();
  } catch (err) {
    return "UNKNOWN_HOST_" + process.env.COMPUTERNAME;
  }
}

export async function checkLicense() {
  const licensePath = path.join(__dirname, '../../license.txt');
  const hwid = getHWID();
  
  if (!fs.existsSync(licensePath)) {
    console.log("\n🛑 NO LICENSE DETECTED.");
    console.log(`🔑 YOUR HWID: ${hwid}`);
    console.log("Send this HWID to Lorenzo to get your activation token.");
    process.exit(1);
  }

  const token = fs.readFileSync(licensePath, 'utf-8').trim();
  const REMOTE_API = process.env.LICENSE_SERVER_URL || "https://empire-license.lorenzo.workers.dev";

  try {
    console.log("📡 VERIFYING LICENSE WITH EMPIRE SERVER...");
    const response = await fetch(`${REMOTE_API}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, hwid })
    });

    const data: any = await response.json();
    if (!data.valid) {
      throw new Error("Activation rejected by server.");
    }

    console.log("✅ LICENSE VERIFIED: Empire Access Granted.\n");
  } catch (err: any) {
    console.log("\n❌ LICENSE VERIFICATION FAILED.");
    console.log(`Error: ${err.message}`);
    process.exit(1);
  }
}

export function generateTokenForUser(userHwid: string) {
  const secret = "EMPIRE_SECRET_2026";
  return crypto.createHmac('sha256', secret).update(userHwid).digest('hex');
}
