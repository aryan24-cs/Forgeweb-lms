import fs from 'fs';
import path from 'path';

const removeDarkClasses = (dir) => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            removeDarkClasses(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            // Enhanced Regex to match Tailwind dark mode utility classes strictly
            // Matches dark:bg-slate-800, dark:text-white, dark:hover:bg-slate-700/50, etc.
            const newContent = content.replace(/dark:[a-zA-Z0-9\-\/\[\]#%]+(\s+)?/g, '');
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log(`Updated ${file}`);
            }
        }
    }
}

removeDarkClasses('./src');
console.log('Complete!');
