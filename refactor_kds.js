const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'NASHTY_KDS_Mockup.html');
const destDir = path.join(__dirname, 'frontend', 'kds');

const content = fs.readFileSync(srcFile, 'utf-8');

const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/i;
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/i;

const styleMatch = styleRegex.exec(content);
const scriptMatch = scriptRegex.exec(content);

if (styleMatch) {
  fs.writeFileSync(path.join(destDir, 'css', 'app.css'), styleMatch[1].trim());
}

if (scriptMatch) {
  fs.writeFileSync(path.join(destDir, 'js', 'app.js'), scriptMatch[1].trim());
}

let newHtml = content
  .replace(styleRegex, '<link rel="stylesheet" href="css/app.css">')
  .replace(scriptRegex, '<script src="js/app.js"></script>');

fs.writeFileSync(path.join(destDir, 'index.html'), newHtml);

console.log('KDS refactoring complete!');
