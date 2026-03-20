import cron from 'node-cron';
import { exec } from 'child_process';
import path from 'path';

console.log("=========================================");
console.log("🤖 Infinity Money Bot: Auto-Poster Active");
console.log("=========================================");
console.log("Mode: Max Viral Growth (9 AM, 3 PM, 8 PM, 12 AM EST)");

// Run at 0 minutes past 0, 9, 15 (3 PM), and 20 (8 PM) every single day
cron.schedule('0 0,9,15,20 * * *', () => {
    console.log(`\n[${new Date().toISOString()}] 🚀 Kicking off scheduled pipeline run...`);
    const scriptPath = path.resolve(process.cwd(), 'src/index.ts');
    
    // We run the index.ts directly via tsx
    const child = exec(`npx tsx "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Execution error: ${error.message}`);
            return;
        }
        if (stderr && stderr.includes('Error')) {
            console.error(`⚠️  Stderr: ${stderr}`);
        }
        console.log(`✅ Pipeline executed successfully:\n${stdout}`);
    });
    
    // Pipe output to the console so you can watch it run in the background
    if (child.stdout) child.stdout.pipe(process.stdout);
    if (child.stderr) child.stderr.pipe(process.stderr);
});

console.log("Bot is sleeping until the next 12-hour tick... (Press Ctrl+C to exit)");
