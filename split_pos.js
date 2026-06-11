const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'NASHTY_POS_Mockup.html');
const destDir = path.join(__dirname, 'frontend', 'pos');

const content = fs.readFileSync(srcFile, 'utf-8');

// Helper to extract regex matches
function extract(regex) {
  const matches = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}

// 1. Extract CSS
const styles = extract(/<style[^>]*>([\s\S]*?)<\/style>/gi).join('\n\n');

// A very simple split for CSS (In a real scenario, we'd parse the CSS AST, but here we can just dump chunks or put it all in base.css for now and split it manually or by simple string searching)
// Let's just put variables in variables.css and the rest in base.css for now, then we can refine.
const variablesMatch = styles.match(/:root\s*{[^}]+}/);
let variablesCss = variablesMatch ? variablesMatch[0] : '';
let baseCss = styles.replace(variablesCss, '');

fs.writeFileSync(path.join(destDir, 'css', 'variables.css'), variablesCss);
fs.writeFileSync(path.join(destDir, 'css', 'base.css'), baseCss);
fs.writeFileSync(path.join(destDir, 'css', 'layout.css'), '/* Layout styles */');
fs.writeFileSync(path.join(destDir, 'css', 'components.css'), '/* Components styles */');
fs.writeFileSync(path.join(destDir, 'css', 'modal.css'), '/* Modal styles */');
fs.writeFileSync(path.join(destDir, 'css', 'pages.css'), '/* Pages styles */');
fs.writeFileSync(path.join(destDir, 'css', 'utilities.css'), '/* Utilities */');

// 2. Extract JS
const scripts = extract(/<script[^>]*>([\s\S]*?)<\/script>/gi).join('\n\n');

// For simplicity in this automated script, we write the bulk of it to app.js and create empty placeholders for the rest
// We would manually move functions later, or if we had AST parsing, we could do it here.
fs.writeFileSync(path.join(destDir, 'js', 'app.js'), scripts);
fs.writeFileSync(path.join(destDir, 'js', 'state.js'), '// State management');
fs.writeFileSync(path.join(destDir, 'js', 'api.js'), '// API calls');
fs.writeFileSync(path.join(destDir, 'js', 'auth.js'), '// Auth logic');
fs.writeFileSync(path.join(destDir, 'js', 'products.js'), '// Products logic');
fs.writeFileSync(path.join(destDir, 'js', 'orders.js'), '// Orders logic');
fs.writeFileSync(path.join(destDir, 'js', 'cart.js'), '// Cart logic');
fs.writeFileSync(path.join(destDir, 'js', 'modal.js'), '// Modal logic');
fs.writeFileSync(path.join(destDir, 'js', 'history.js'), '// History logic');
fs.writeFileSync(path.join(destDir, 'js', 'utils.js'), '// Utils');

// 3. Extract HTML Body
const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
let bodyHtml = bodyMatch ? bodyMatch[1] : '';

// Remove script tags from bodyHtml just in case
bodyHtml = bodyHtml.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');

// We can extract some obvious components if they have IDs or classes.
// For now, write everything back to index.html but with links to the new CSS and JS
const newHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>NASHTY OS — POS</title>
  <link rel="stylesheet" href="css/variables.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/layout.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/modal.css">
  <link rel="stylesheet" href="css/pages.css">
  <link rel="stylesheet" href="css/utilities.css">
</head>
<body class="day">
  ${bodyHtml}
  <script src="js/utils.js"></script>
  <script src="js/state.js"></script>
  <script src="js/api.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/products.js"></script>
  <script src="js/orders.js"></script>
  <script src="js/cart.js"></script>
  <script src="js/modal.js"></script>
  <script src="js/history.js"></script>
  <script src="js/app.js"></script>
</body>
</html>`;

fs.writeFileSync(path.join(destDir, 'index.html'), newHtml);

console.log('Split completed successfully.');
