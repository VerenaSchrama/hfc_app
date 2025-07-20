import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get the original DATABASE_URL
original_url = os.getenv("DATABASE_URL")

def create_database_url():
    """Create a database URL that forces IPv4 connection to Supabase"""
    if not original_url or "supabase.co" not in original_url:
        return original_url
    
    # Parse the Supabase URL
    # Format: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
    if "postgresql://" not in original_url:
        return original_url
    
    # Extract components
    url_without_protocol = original_url.replace("postgresql://", "")
    parts = url_without_protocol.split("@")
    
    if len(parts) != 2:
        return original_url
    
    credentials = parts[0]  # postgres:password
    host_database = parts[1]  # db.xxx.supabase.co:5432/postgres
    
    # Split host:port and database
    if "/" not in host_database:
        return original_url
    
    host_port, database = host_database.split("/", 1)
    
    # Split host and port
    if ":" in host_port:
        host, port = host_port.split(":")
    else:
        host = host_port
        port = "5432"
    
    # Create new URL with IPv4 forcing parameters
    new_url = f"postgresql://{credentials}@{host}:{port}/{database}"
    
    # Add connection parameters
    params = [
        "sslmode=prefer",
        "connect_timeout=10",
        "application_name=hfc_app",
        "client_encoding=utf8"
    ]
    
    # Add the parameters to the URL
    if "?" in new_url:
        new_url += "&" + "&".join(params)
    else:
        new_url += "?" + "&".join(params)
    
    print(f"Using IPv4-forced Supabase connection: {new_url}")
    return new_url

# Create the database URL
SQLALCHEMY_DATABASE_URL = create_database_url()

# Create engine with IPv4 forcing
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_timeout=20,
    pool_size=5,
    max_overflow=10,
    echo=False,
    future=True,
    # Force IPv4 connection parameters
    connect_args={
        "connect_timeout": 10,
        "application_name": "hfc_app",
        "client_encoding": "utf8"
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

print(os.path.abspath('data/strategies.csv'))
print(os.path.exists('data/strategies.csv')) 