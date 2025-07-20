#!/usr/bin/env python3
"""
Test script to check database connection with different approaches
"""
import os
import psycopg2
from sqlalchemy import create_engine, text

def test_direct_psycopg2():
    """Test direct psycopg2 connection"""
    print("=== Testing direct psycopg2 connection ===")
    
    try:
        # Get connection parameters from DATABASE_URL
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            print("No DATABASE_URL found")
            return False
            
        # Parse the URL
        # postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
        url_parts = db_url.replace("postgresql://", "").split("@")
        if len(url_parts) != 2:
            print("Invalid DATABASE_URL format")
            return False
            
        credentials = url_parts[0]
        host_db = url_parts[1]
        
        user, password = credentials.split(":")
        host_port, database = host_db.split("/")
        
        if ":" in host_port:
            host, port = host_port.split(":")
        else:
            host = host_port
            port = "5432"
        
        print(f"Connecting to: {host}:{port}/{database}")
        
        # Try connection with different parameters
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            sslmode='prefer',
            connect_timeout=10
        )
        
        # Test query
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Connection successful! PostgreSQL version: {version[0]}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def test_sqlalchemy():
    """Test SQLAlchemy connection"""
    print("\n=== Testing SQLAlchemy connection ===")
    
    try:
        from db import engine
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()
            print(f"✅ SQLAlchemy connection successful! PostgreSQL version: {version[0]}")
            return True
            
    except Exception as e:
        print(f"❌ SQLAlchemy connection failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing database connections...")
    
    # Test direct psycopg2
    psycopg2_success = test_direct_psycopg2()
    
    # Test SQLAlchemy
    sqlalchemy_success = test_sqlalchemy()
    
    print(f"\n=== Results ===")
    print(f"Direct psycopg2: {'✅ Success' if psycopg2_success else '❌ Failed'}")
    print(f"SQLAlchemy: {'✅ Success' if sqlalchemy_success else '❌ Failed'}") 