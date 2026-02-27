import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix pages
const srcDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
    const filePath = path.join(srcDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(/glass-card rounded-2xl p-6 hover:shadow-lg transition-all/g, 'fw-card p-6');
    content = content.replace(/glass-card rounded-2xl p-6/g, 'fw-card p-6');
    content = content.replace(/glass-card rounded-2xl p-5 hover:shadow-lg transition-all/g, 'fw-card p-5');
    content = content.replace(/glass-card rounded-2xl border border-slate-200 dark:border-slate-700/g, 'fw-card');
    content = content.replace(/glass-card rounded-2xl/g, 'fw-card');
    content = content.replace(/glass-card/g, 'fw-card');

    content = content.replace(/glass-input/g, 'fw-input');

    fs.writeFileSync(filePath, content);
}

// Fix Layout components
const layoutDir = path.join(__dirname, 'src', 'components', 'layout');
const layoutFiles = fs.readdirSync(layoutDir).filter(f => f.endsWith('.jsx'));

for (const file of layoutFiles) {
    const filePath = path.join(layoutDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/glass-input/g, 'fw-input');
    fs.writeFileSync(filePath, content);
}

console.log('Cleaned up UI classes');
