import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

# Get Supabase environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Get the original DATABASE_URL for fallback
original_url = os.getenv("DATABASE_URL")

def create_database_url():
    """Create a database URL using Supabase connection string"""
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
    
    # Create new URL with connection parameters
    new_url = f"postgresql://{credentials}@{host}:{port}/{database}"
    
    # Add connection parameters
    params = [
        "sslmode=require",
        "connect_timeout=10",
        "application_name=hfc_app",
        "client_encoding=utf8"
    ]
    
    # Add the parameters to the URL
    if "?" in new_url:
        new_url += "&" + "&".join(params)
    else:
        new_url += "?" + "&".join(params)
    
    print(f"Using Supabase connection: {new_url}")
    return new_url

def test_supabase_connection():
    """Test Supabase client connection"""
    try:
        print("Testing Supabase client connection...")
        
        # Test the Supabase client
        response = supabase.table('users').select('*').limit(1).execute()
        print("✅ Supabase client connection successful!")
        return True
        
    except Exception as e:
        print(f"❌ Supabase client connection failed: {e}")
        return False

# Test Supabase connection
supabase_connection_success = test_supabase_connection()

# Create the database URL
if supabase_connection_success:
    SQLALCHEMY_DATABASE_URL = create_database_url()
    print("✅ Using Supabase database")
else:
    # Fallback to SQLite
    SQLALCHEMY_DATABASE_URL = "sqlite:///./users.db"
    print("⚠️ Supabase connection failed, falling back to SQLite")
    print("⚠️ Note: This means user data will not persist across deployments")

# Create engine with appropriate configuration
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    # SQLite configuration
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )
else:
    # PostgreSQL configuration
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_timeout=20,
        pool_size=5,
        max_overflow=10,
        echo=False,
        future=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

print(os.path.abspath('data/strategies.csv'))
print(os.path.exists('data/strategies.csv')) 