const fs = require('fs');
let code = fs.readFileSync('backoffice/backend/src/routes/orders.ts', 'utf8');

// We need to replace `const doTransaction = transaction(() => {` with `const doTransaction = async () => {`
// And add `await` to all `run(` and `get(` calls inside the `/api/orders` POST route.

let newCode = code.replace(/const doTransaction = transaction\(\(\) => \{/g, 'const doTransaction = async () => {');
newCode = newCode.replace(/run\(`/g, 'await run(`');
// Replace get inside if (cleanPhone)
newCode = newCode.replace(/let member = get\(/g, 'let member = await get(');
// Replace product get inside item loop
newCode = newCode.replace(/const product = get\(/g, 'const product = await get(');

// Also we need to await the doTransaction call
newCode = newCode.replace(/doTransaction\(\);/g, 'await doTransaction();');

// Also await the get order query
newCode = newCode.replace(/const order = get\(/g, 'const order = await get(');
newCode = newCode.replace(/const items = get\(/g, 'const items = await get(');

fs.writeFileSync('backoffice/backend/src/routes/orders.ts', newCode);
console.log('Fixed orders.ts');
