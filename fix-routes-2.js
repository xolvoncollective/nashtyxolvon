const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'backoffice/backend/src/routes');
const filesToFix = ['auth.ts', 'crm.ts', 'main-auth.ts', 'members.ts'];

for (const file of filesToFix) {
  const filePath = path.join(routesDir, file);
  let code = fs.readFileSync(filePath, 'utf8');

  // Fix router methods to be async if not already
  code = code.replace(/router\.(get|post|put|delete|patch)\('([^']+)',\s*(require\w+,\s*)?\(([^)]+)\)\s*=>/g, 'router.$1(\'$2\', $3async ($4) =>');

  // Replace db.get, db.run, db.query with await
  code = code.replace(/(?<!await\s+)db\.get\(/g, 'await db.get(');
  code = code.replace(/(?<!await\s+)db\.run\(/g, 'await db.run(');
  code = code.replace(/(?<!await\s+)db\.query\(/g, 'await db.query(');
  code = code.replace(/(?<!await\s+)db\.prepare\(([^)]+)\)\.all\(/g, 'await db.prepare($1).all(');

  // Replace standalone get, run, query with await
  code = code.replace(/(?<!await |router\.|app\.|console\.|_|\.)\bget\(/g, 'await get(');
  code = code.replace(/(?<!await |db\.|console\.|_|\.)\brun\(/g, 'await run(');
  code = code.replace(/(?<!await |req\.|res\.|console\.|_|\.)\bquery\(/g, 'await query(');

  fs.writeFileSync(filePath, code);
  console.log('Fixed ' + file);
}
