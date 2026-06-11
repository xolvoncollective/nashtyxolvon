const fs = require('fs');
const path = require('path');

const extracted = fs.readFileSync(path.join(__dirname, 'extracted_scripts.js'), 'utf-8');
const lines = extracted.split('\n');

const jsDir = path.join(__dirname, 'frontend', 'pos', 'js');

const slice = (start, end) => lines.slice(start - 1, end).join('\n') + '\n';

const stateJs = slice(1, 134);
const utilsJs = slice(135, 141) + slice(1158, 1164);
const authJs = slice(142, 209);
const appJs1 = slice(210, 221);
const productsJs = slice(222, 302);
const modalJs = slice(303, 440);
const cartJs = slice(441, 559);
const ordersJs = slice(560, 893);
const historyJs = slice(894, 1088);
const appJs2 = slice(1089, 1157);
const appJs3 = slice(1165, lines.length);

fs.writeFileSync(path.join(jsDir, 'state.js'), stateJs);
fs.writeFileSync(path.join(jsDir, 'utils.js'), utilsJs);
fs.writeFileSync(path.join(jsDir, 'auth.js'), authJs);
fs.writeFileSync(path.join(jsDir, 'products.js'), productsJs);
fs.writeFileSync(path.join(jsDir, 'modal.js'), modalJs);
fs.writeFileSync(path.join(jsDir, 'cart.js'), cartJs);
fs.writeFileSync(path.join(jsDir, 'orders.js'), ordersJs);
fs.writeFileSync(path.join(jsDir, 'history.js'), historyJs);
fs.writeFileSync(path.join(jsDir, 'app.js'), appJs1 + appJs2 + appJs3);
fs.writeFileSync(path.join(jsDir, 'api.js'), '// API implementation\n');

console.log('JS files successfully re-split!');
