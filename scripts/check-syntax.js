#!/usr/bin/env node
/**
 * Syntax Checker for NASHTY OS
 * Validates JavaScript syntax using Node.js --check
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filesToCheck = [
  'api-client.js',
  'utils/storage.js',
  'utils/pagination.js',
  'utils/performance.js',
  'backoffice/frontend/js/pages/*.js',
  'backoffice/frontend/js/*.js',
  'pos/frontend/js/*.js',
  'kds/frontend/js/*.js',
  'crm/frontend/js/*.js'
];

// Simple glob expansion (no external dependency)
function expandGlob(pattern) {
  const parts = pattern.split('/');
  let currentPath = '.';
  let files = [currentPath];

  parts.forEach((part, index) => {
    if (part === '**') {
      // Recursive directory traversal
      const newFiles = [];
      files.forEach(dir => {
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
          const traverse = (d) => {
            const entries = fs.readdirSync(d);
            entries.forEach(entry => {
              const fullPath = path.join(d, entry);
              if (fs.statSync(fullPath).isDirectory()) {
                newFiles.push(fullPath);
                traverse(fullPath);
              }
            });
          };
          traverse(dir);
        }
      });
      files = newFiles;
    } else if (part.includes('*')) {
      // Wildcard matching
      const regex = new RegExp('^' + part.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
      const newFiles = [];
      files.forEach(dir => {
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
          const entries = fs.readdirSync(dir);
          entries.forEach(entry => {
            if (regex.test(entry)) {
              newFiles.push(path.join(dir, entry));
            }
          });
        }
      });
      files = newFiles;
    } else if (index < parts.length - 1) {
      // Regular directory
      files = files.map(f => path.join(f, part)).filter(f => fs.existsSync(f));
    } else {
      // Final part (filename)
      files = files.map(f => path.join(f, part)).filter(f => fs.existsSync(f) && fs.statSync(f).isFile());
    }
  });

  return files;
}

console.log('🔍 Checking JavaScript syntax...\n');

let errors = 0;
let checked = 0;

filesToCheck.forEach(pattern => {
  const files = expandGlob(pattern);
  
  files.forEach(file => {
    try {
      execSync(`node --check "${file}"`, { stdio: 'pipe' });
      console.log(`✅ ${file}`);
      checked++;
    } catch (e) {
      console.error(`❌ ${file}`);
      const stderr = e.stderr ? e.stderr.toString() : e.message;
      console.error(stderr);
      errors++;
    }
  });
});

console.log(`\n📊 Summary: ${checked} files checked`);

if (errors > 0) {
  console.error(`\n❌ ${errors} file(s) failed syntax check\n`);
  process.exit(1);
} else {
  console.log('\n✅ All files passed syntax check\n');
  process.exit(0);
}
