import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
    const filePath = path.join(srcDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace default cards with glass-cards
    content = content.replace(/bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700\/50/g, 'glass-card rounded-2xl');
    content = content.replace(/bg-white dark:bg-slate-900/g, 'glass-card');
    content = content.replace(/bg-slate-50 dark:bg-slate-950/g, 'bg-transparent');

    // Replace generic inputs with glass-input
    const oldInputStr = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';
    content = content.replace(new RegExp(oldInputStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'glass-input');

    const oldInput2 = 'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-sm';
    content = content.replace(new RegExp(oldInput2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'glass-input');

    fs.writeFileSync(filePath, content);
}
console.log('Updated components with glass classes');
