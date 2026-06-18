const db = require('better-sqlite3')('../../data/nashtypos.db');
try {
  db.prepare("INSERT INTO shifts (id, outlet_id, user_id, start_cash, status) VALUES ('test-shift-2', 'demo-outlet', 'admin', 0, 'open')").run();
  console.log("Insert success!");
} catch (e) {
  console.log("Insert failed:", e.message);
}
