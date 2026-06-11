const fs = require('fs');

const file = process.argv[2];
const content = fs.readFileSync(file, 'utf-8');

const styles = [];
const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
let match;
while ((match = styleRegex.exec(content)) !== null) {
  styles.push(match[1]);
}

const scripts = [];
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
while ((match = scriptRegex.exec(content)) !== null) {
  scripts.push(match[1]);
}

fs.writeFileSync('extracted_styles.css', styles.join('\n\n/* ==================== */\n\n'));
fs.writeFileSync('extracted_scripts.js', scripts.join('\n\n/* ==================== */\n\n'));

console.log(`Extracted ${styles.length} style blocks and ${scripts.length} script blocks.`);
