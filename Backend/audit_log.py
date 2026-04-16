import sqlite3
import datetime
import os

from config import Config

def init_db():
    conn = sqlite3.connect(Config.DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            event_type TEXT,
            data TEXT
        )
    ''')
    conn.commit()
    conn.close()

def log_event(event_type, data):
    ts = datetime.datetime.now().isoformat()
    try:
        conn = sqlite3.connect(Config.DB_PATH)
        c = conn.cursor()
        c.execute("INSERT INTO events (timestamp, event_type, data) VALUES (?, ?, ?)", 
                  (ts, event_type, data))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error logging to DB: {e}")

def get_recent_logs(limit=50):
    try:
        conn = sqlite3.connect(Config.DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM events ORDER BY id DESC LIMIT ?", (limit,))
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error reading from DB: {e}")
        return []
