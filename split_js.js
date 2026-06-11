const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, 'frontend', 'pos', 'js');
const appJsPath = path.join(jsDir, 'app.js');

const content = fs.readFileSync(appJsPath, 'utf-8');

// The file has functions and comments. We can split it roughly by searching for function names or comments.
let stateJs = [];
let apiJs = [];
let authJs = [];
let productsJs = [];
let ordersJs = [];
let cartJs = [];
let modalJs = [];
let historyJs = [];
let utilsJs = [];
let appJs = [];

const lines = content.split('\n');

let currentSection = appJs;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('// --- STATE') || line.includes('let cart =') || line.includes('let orders =')) {
    currentSection = stateJs;
  } else if (line.includes('// --- API') || line.includes('async function fetch')) {
    currentSection = apiJs;
  } else if (line.includes('// --- AUTH') || line.includes('function login') || line.includes('login(')) {
    currentSection = authJs;
  } else if (line.includes('// --- PRODUCTS') || line.includes('function renderProducts')) {
    currentSection = productsJs;
  } else if (line.includes('// --- ORDERS') || line.includes('function renderOrders')) {
    currentSection = ordersJs;
  } else if (line.includes('// --- CART') || line.includes('function addToCart')) {
    currentSection = cartJs;
  } else if (line.includes('// --- MODALS') || line.includes('function openModal')) {
    currentSection = modalJs;
  } else if (line.includes('// --- HISTORY') || line.includes('function renderHistory')) {
    currentSection = historyJs;
  } else if (line.includes('// --- UTILS') || line.includes('function formatCurrency')) {
    currentSection = utilsJs;
  } else if (line.includes('// --- APP') || line.includes('document.addEventListener("DOMContentLoaded"')) {
    currentSection = appJs;
  }
  
  currentSection.push(line);
}

// Ensure all are written
fs.writeFileSync(path.join(jsDir, 'state.js'), stateJs.join('\n'));
fs.writeFileSync(path.join(jsDir, 'api.js'), apiJs.join('\n'));
fs.writeFileSync(path.join(jsDir, 'auth.js'), authJs.join('\n'));
fs.writeFileSync(path.join(jsDir, 'products.js'), productsJs.join('\n'));
fs.writeFileSync(path.join(jsDir, 'orders.js'), ordersJs.join('\n'));
fs.writeFileSync(path.join(jsDir, 'cart.js'), cartJs.join('\n'));
fs.writeFileSync(path.join(jsDir, 'modal.js'), modalJs.join('\n'));
fs.writeFileSync(path.join(jsDir, 'history.js'), historyJs.join('\n'));
fs.writeFileSync(path.join(jsDir, 'utils.js'), utilsJs.join('\n'));
fs.writeFileSync(path.join(jsDir, 'app.js'), appJs.join('\n'));

console.log('JS split completed successfully.');
