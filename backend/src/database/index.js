import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

// Fix for Node 17+ defaulting to IPv6 which causes timeouts for Supabase on some networks
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const { Pool } = pg;

// Connection string from environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("WARNING: DATABASE_URL is not set in your .env file! Database calls will fail.");
}

const pool = new Pool({
  connectionString,
  // Enable SSL for any remote (non-localhost) PostgreSQL connection
  ssl: connectionString && !connectionString.includes('localhost')
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  keepAlive: true
});

pool.on('error', (err) => {
  console.error('Unexpected database pool connection error:', err);
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query: ${text.split('\n')[0]}... [Duration: ${duration}ms, Rows: ${res.rowCount}]`);
    return res;
  } catch (error) {
    console.error(`Database Query Error!`, { text, error: error.message });
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  
  // monkey patch for duration logging
  client.query = (...args) => {
    console.log(`Executed transaction query: ${args[0].split('\n')[0]}`);
    return query.apply(client, args);
  };
  
  client.release = () => {
    client.query = query;
    client.release = release;
    return release.apply(client);
  };
  
  return client;
};

export default {
  query,
  getClient,
  pool
};
