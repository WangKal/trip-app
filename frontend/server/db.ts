import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

// Check if DATABASE_URL exists, otherwise use dummy data
const isOffline = !process.env.DATABASE_URL;

export const pool = mysql.createPool("mysql://root@localhost:3306/citizen_connect");

export const db = drizzle("mysql://root@localhost:3306/citizen_connect");

/*const db = isOffline
  ? { query: () => [] } // Dummy query function returning empty data
  : drizzle(pool, { schema });*/