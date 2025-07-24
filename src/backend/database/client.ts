import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { logInfo } from '../utils/logger';

const require = createRequire(import.meta.url);
const knex = require('knex');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'admdb.sqlite');
logInfo("INI ALAMAT TABLENYA : ",dbPath)
const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
});

export default db;
