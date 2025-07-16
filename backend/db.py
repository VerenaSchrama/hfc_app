import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get the original DATABASE_URL
original_url = os.getenv("DATABASE_URL")

# Use original DATABASE_URL with SSL configuration
if original_url and "supabase.co" in original_url:
    # Add SSL configuration to the original URL
    if "?" not in original_url:
        SQLALCHEMY_DATABASE_URL = original_url + "?sslmode=require&connect_timeout=10"
    else:
        SQLALCHEMY_DATABASE_URL = original_url + "&sslmode=require&connect_timeout=10"
    
    print(f"Using connection: {SQLALCHEMY_DATABASE_URL}")
else:
    SQLALCHEMY_DATABASE_URL = original_url

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_timeout=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

print(os.path.abspath('data/strategies.csv'))
print(os.path.exists('data/strategies.csv')) 