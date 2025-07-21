import psycopg2
import os
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

def create_schema():
    # Get DATABASE_URL from .env
    database_url = os.getenv('DATABASE_URL')
    url = urlparse(database_url)
    
    conn_params = {
        "host": url.hostname,
        "port": url.port,
        "database": url.path[1:],
        "user": url.username,
        "password": url.password,
        "sslmode": "require",
        "gssencmode": "disable"
    }
    
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(**conn_params)
        cur = conn.cursor()
        
        # Read schema file
        with open('db_setup/schema.sql', 'r') as f:
            schema = f.read()
        
        # Execute schema
        print("Creating schema...")
        cur.execute(schema)
        conn.commit()
        
        print("✅ Schema created successfully!")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

create_schema()