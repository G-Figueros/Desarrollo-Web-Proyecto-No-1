// app.js
(function (global) {
  let SQL, db, opening;

  // Usa las MISMAS rutas que en tus HTML
  const WASM_LOCATOR = f => `./assets/sqljs/${f}`;
  const DB_PATH = `./db/dbProyecto.db`;

  async function open() {
    if (opening) return opening;
    opening = (async () => {
      // Carga el motor (sql.js) desde tus assets locales
      SQL = await initSqlJs({ locateFile: WASM_LOCATOR });

      // Descarga la base sin cache agresiva
      const res = await fetch(`${DB_PATH}?ts=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`No se pudo descargar la BD: ${res.status}`);
      const buf = await res.arrayBuffer();

      // Abre la base en memoria
      db = new SQL.Database(new Uint8Array(buf));
      return db;
    })();
    return opening;
  }

  function ensureDB() {
    if (!db) throw new Error('DB no inicializada. Llama primero a DB.open()');
    return db;
  }

  // Devuelve todas las filas (array de objetos)
  function queryAll(sql, params = []) {
    const d = ensureDB();
    const stmt = d.prepare(sql);
    try {
      stmt.bind(params);
      const out = [];
      while (stmt.step()) out.push(stmt.getAsObject());
      return out;
    } finally {
      stmt.free();
    }
  }

  // Devuelve una sola fila (o null)
  function queryOne(sql, params = []) {
    const rows = queryAll(sql, params);
    return rows.length ? rows[0] : null;
    }

  // Escapar HTML al imprimir
  function escapeHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'
    }[m]));
  }

  // Cerrar (opcional, solo si ya no consultarás más)
  function close() {
    if (db) { db.close(); db = null; opening = null; }
  }

  global.DB = { open, queryAll, queryOne, escapeHTML, close };
})(window);
