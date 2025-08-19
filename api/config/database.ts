import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const useSSL = (process.env.DB_SSL === 'true' || process.env.DB_SSL === '1'); // Habilita SSL quando DB_SSL=true

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost', // IP do PostgreSQL
  database: process.env.DB_NAME || 'telemedicina',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  ssl: useSSL ? { rejectUnauthorized: false } : false, // SSL para banco remoto
  keepAlive: true,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Teste de conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão PostgreSQL:', err);
});

export default pool;