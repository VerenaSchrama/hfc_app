import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get the original DATABASE_URL
original_url = os.getenv("DATABASE_URL")

# Try direct connection with different SSL settings for IPv4 compatibility
if original_url and "supabase.co" in original_url:
    # Try direct connection with different SSL modes
    if "postgresql://" in original_url:
        # Try with sslmode=prefer instead of require
        if "?" not in original_url:
            SQLALCHEMY_DATABASE_URL = original_url + "?sslmode=prefer&connect_timeout=10&application_name=hfc_app"
        else:
            SQLALCHEMY_DATABASE_URL = original_url + "&sslmode=prefer&connect_timeout=10&application_name=hfc_app"
        
        print(f"Using direct connection with sslmode=prefer: {SQLALCHEMY_DATABASE_URL}")
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
    # Standard connection pooling settings
    pool_size=5,
    max_overflow=10,
    # Additional settings for better compatibility
    echo=False,  # Set to True for debugging
    future=True  # Use SQLAlchemy 2.0 style
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

print(os.path.abspath('data/strategies.csv'))
print(os.path.exists('data/strategies.csv')) 