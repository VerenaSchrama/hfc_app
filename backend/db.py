import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get the original DATABASE_URL
original_url = os.getenv("DATABASE_URL")

# Use Supabase Session Pooler for IPv4 compatibility
if original_url and "supabase.co" in original_url:
    # Convert direct connection to session pooler connection
    # Replace the port and add pooler-specific parameters
    if "postgresql://" in original_url:
        # Extract components from the original URL
        # Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
        # Convert to: postgresql://postgres:[password]@db.[project-ref].supabase.co:6543/postgres?pgbouncer=true
        
        # Replace port 5432 with 6543 (session pooler port)
        pooler_url = original_url.replace(":5432/", ":6543/")
        
        # Add session pooler parameters
        if "?" not in pooler_url:
            SQLALCHEMY_DATABASE_URL = pooler_url + "?pgbouncer=true&sslmode=require&connect_timeout=10"
        else:
            SQLALCHEMY_DATABASE_URL = pooler_url + "&pgbouncer=true&sslmode=require&connect_timeout=10"
        
        print(f"Using Supabase Session Pooler: {SQLALCHEMY_DATABASE_URL}")
    else:
        # Fallback to original URL with SSL
        if "?" not in original_url:
            SQLALCHEMY_DATABASE_URL = original_url + "?sslmode=require&connect_timeout=10"
        else:
            SQLALCHEMY_DATABASE_URL = original_url + "&sslmode=require&connect_timeout=10"
        print(f"Using direct connection: {SQLALCHEMY_DATABASE_URL}")
else:
    SQLALCHEMY_DATABASE_URL = original_url

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_timeout=20,
    # Session pooler specific settings
    pool_size=1,  # Use minimal pool size for session pooler
    max_overflow=0,  # Don't allow overflow connections
    # Disable connection pooling at SQLAlchemy level when using pgbouncer
    poolclass=None if "pgbouncer=true" in SQLALCHEMY_DATABASE_URL else None
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

print(os.path.abspath('data/strategies.csv'))
print(os.path.exists('data/strategies.csv')) 