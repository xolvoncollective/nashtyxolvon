const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, 'frontend', 'pos', 'css');
const baseCssPath = path.join(cssDir, 'base.css');

const content = fs.readFileSync(baseCssPath, 'utf-8');

// The file has several sections indicated by comments.
// We'll use simple string matching to split the content for this mock setup.

let baseCss = [];
let layoutCss = [];
let componentsCss = [];
let modalCss = [];
let pagesCss = [];
let utilitiesCss = [];

const sections = content.split('/* ══');

for (let section of sections) {
  if (section.includes('LOGIN SCREEN')) {
    pagesCss.push('/* ══' + section);
  } else if (section.includes('MODALS') || section.includes('OVERLAYS') || section.includes('PAYMENT MODAL') || section.includes('MODAL')) {
    modalCss.push('/* ══' + section);
  } else if (section.includes('MENU PANEL') || section.includes('CART PANEL') || section.includes('TOPBAR') || section.includes('LAYOUT')) {
    layoutCss.push('/* ══' + section);
  } else if (section.includes('POS BODY') || section.includes('MODULES') || section.includes('HISTORY')) {
    componentsCss.push('/* ══' + section);
  } else {
    baseCss.push((section.startsWith('/* ══') ? '' : '/* ══') + section);
  }
}

// Write the split content
fs.writeFileSync(path.join(cssDir, 'base.css'), baseCss.join('\n'));
fs.writeFileSync(path.join(cssDir, 'layout.css'), layoutCss.join('\n'));
fs.writeFileSync(path.join(cssDir, 'components.css'), componentsCss.join('\n'));
fs.writeFileSync(path.join(cssDir, 'modal.css'), modalCss.join('\n'));
fs.writeFileSync(path.join(cssDir, 'pages.css'), pagesCss.join('\n'));
fs.writeFileSync(path.join(cssDir, 'utilities.css'), utilitiesCss.join('\n'));

console.log('CSS split completed successfully.');
