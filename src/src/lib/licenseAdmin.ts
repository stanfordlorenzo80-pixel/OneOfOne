import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateTokenForUser } from './license.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../registrations.json');

export function registerNewCustomer(name: string, hwid: string) {
  const registrations = fs.existsSync(DB_PATH) 
    ? JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) 
    : [];

  const token = generateTokenForUser(hwid);
  
  registrations.push({
    date: new Date().toISOString(),
    name,
    hwid,
    token,
    status: 'ACTIVE'
  });

  fs.writeFileSync(DB_PATH, JSON.stringify(registrations, null, 2));
  
  console.log('\n=========================================');
  console.log('💎 NEW CUSTOMER REGISTERED');
  console.log('=========================================');
  console.log(`👤 Name: ${name}`);
  console.log(`🔑 HWID: ${hwid}`);
  console.log(`🎟️ TOKEN: ${token}`);
  console.log('=========================================\n');
  
  return token;
}
