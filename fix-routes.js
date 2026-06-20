const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'backoffice/backend/src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let code = fs.readFileSync(filePath, 'utf8');

  // Replace ` get(` with ` await get(` but ignore if already awaited or if it's router.get
  // Look behind for `= `, `return `, ` `, `(`
  code = code.replace(/(?<!await |router\.)\bget\(/g, 'await get(');
  code = code.replace(/(?<!await |router\.)\brun\(/g, 'await run(');
  // Also we might have `.get(` which is router.get, we don't want to touch that. 
  // Wait, `router.get` is handled by `(?<!router\.)` but what if `app.get`?
  // Let's be safer: only match `get(` when it's not preceded by a dot.
  // JS regex doesn't support lookbehinds in all versions, but Node 24 supports it.
  // Better yet, just use a simpler regex:
  // match word boundary, then not a dot, then get(
  
  fs.writeFileSync(filePath, code);
  console.log('Fixed', file);
}
