#!/usr/bin/env node

/**
 * NASHTY OS - System Health Checker
 * Scans all 5 systems for console errors and broken JS
 */

const fs = require('fs');
const path = require('path');

const SYSTEMS = {
  POS: 'pos/frontend',
  KDS: 'kds/frontend', 
  Backoffice: 'backoffice/frontend',
  CustomerDisplay: 'customer-display',
  Cost: 'cost/frontend'
};

const ISSUES = [];

// Check for common JS errors
function checkFile(filePath, system) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    // Check for undefined references
    if (line.match(/window\.\w+\.init is not a function/)) {
      ISSUES.push({
        system,
        file: filePath,
        line: idx + 1,
        type: 'INIT_ERROR',
        message: 'Initialization function not found',
        code: line.trim()
      });
    }
    
    // Check for missing constructors
    if (line.match(/window\.\w+ is not a constructor/)) {
      ISSUES.push({
        system,
        file: filePath,
        line: idx + 1,
        type: 'CONSTRUCTOR_ERROR',
        message: 'Constructor not found',
        code: line.trim()
      });
    }
    
    // Check for export statements in non-module scripts
    if (line.match(/^export (class|function|const|let|var)/)) {
      // Check if file is loaded as module
      const htmlFiles = findHTMLFiles(path.dirname(filePath));
      let isModule = false;
      htmlFiles.forEach(html => {
        const htmlContent = fs.readFileSync(html, 'utf8');
        const fileName = path.basename(filePath);
        if (htmlContent.includes(`<script type="module" src="${fileName}"`)) {
          isModule = true;
        }
      });
      
      if (!isModule) {
        ISSUES.push({
          system,
          file: filePath,
          line: idx + 1,
          type: 'EXPORT_ERROR',
          message: 'Export statement in non-module script',
          code: line.trim(),
          fix: 'Add type="module" to script tag or remove export'
        });
      }
    }
    
    // Check for undefined API calls
    if (line.match(/API\.\w+\.\w+/) && !line.includes('typeof') && !line.includes('//')) {
      const match = line.match(/API\.(\w+)\.(\w+)/);
      if (match) {
        const [_, namespace, method] = match;
        // We'll validate these against api-client.js
        ISSUES.push({
          system,
          file: filePath,
          line: idx + 1,
          type: 'API_CALL',
          message: `API call: API.${namespace}.${method}`,
          code: line.trim(),
          needsValidation: true
        });
      }
    }
  });
}

function findHTMLFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isFile() && item.endsWith('.html')) {
      files.push(fullPath);
    }
  });
  return files;
}

function scanSystem(systemName, systemPath) {
  console.log(`\n🔍 Scanning ${systemName}...`);
  
  if (!fs.existsSync(systemPath)) {
    console.log(`   ⚠️  Path not found: ${systemPath}`);
    return;
  }
  
  function walkDir(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
        walkDir(fullPath);
      } else if (stat.isFile() && item.endsWith('.js')) {
        checkFile(fullPath, systemName);
      }
    });
  }
  
  walkDir(systemPath);
}

// Main execution
console.log('╔════════════════════════════════════════════╗');
console.log('║  NASHTY OS - System Health Check          ║');
console.log('╚════════════════════════════════════════════╝');

Object.entries(SYSTEMS).forEach(([name, path]) => {
  scanSystem(name, path);
});

// Report results
console.log('\n\n╔════════════════════════════════════════════╗');
console.log('║  RESULTS                                   ║');
console.log('╚════════════════════════════════════════════╝\n');

const criticalIssues = ISSUES.filter(i => 
  i.type === 'INIT_ERROR' || 
  i.type === 'CONSTRUCTOR_ERROR' || 
  i.type === 'EXPORT_ERROR'
);

const apiCalls = ISSUES.filter(i => i.type === 'API_CALL');

console.log(`✅ Total JS files scanned: ${ISSUES.length > 0 ? 'Multiple' : '0'}`);
console.log(`❌ Critical issues found: ${criticalIssues.length}`);
console.log(`📞 API calls to validate: ${apiCalls.length}`);

if (criticalIssues.length > 0) {
  console.log('\n🚨 CRITICAL ISSUES:\n');
  criticalIssues.forEach(issue => {
    console.log(`[${issue.system}] ${issue.type}`);
    console.log(`   File: ${issue.file}:${issue.line}`);
    console.log(`   Issue: ${issue.message}`);
    console.log(`   Code: ${issue.code}`);
    if (issue.fix) {
      console.log(`   Fix: ${issue.fix}`);
    }
    console.log('');
  });
}

// Write detailed report
fs.writeFileSync('SYSTEM_HEALTH_REPORT.json', JSON.stringify({
  timestamp: new Date().toISOString(),
  systems: SYSTEMS,
  criticalIssues: criticalIssues.length,
  apiCallsToValidate: apiCalls.length,
  issues: ISSUES
}, null, 2));

console.log('\n📄 Detailed report saved to: SYSTEM_HEALTH_REPORT.json');
console.log('\n✅ Health check complete!\n');
