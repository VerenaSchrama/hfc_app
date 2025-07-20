import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Force IPv4 for all PostgreSQL connections
os.environ['PGHOST'] = 'db.qyydgmcfrfezdcejqxgo.supabase.co'
os.environ['PGSSLMODE'] = 'prefer'
os.environ['PGTIMEOUT'] = '10'

# Get the original DATABASE_URL
original_url = os.getenv("DATABASE_URL")

def create_database_url():
    """Create a database URL that forces IPv4 connection to Supabase"""
    if not original_url or "supabase.co" not in original_url:
        return original_url
    
    # Parse the Supabase URL manually
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

def test_database_connection():
    """Test if we can connect to the database"""
    try:
        import psycopg2
        
        # Parse connection details
        db_url = os.getenv("DATABASE_URL")
        if not db_url or "supabase.co" not in db_url:
            return False
            
        url_parts = db_url.replace("postgresql://", "").split("@")
        if len(url_parts) != 2:
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
        
        print(f"Testing direct connection to: {host}:{port}/{database}")
        
        # Try direct connection
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            sslmode='prefer',
            connect_timeout=10
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Direct connection successful! PostgreSQL version: {version[0]}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Direct connection failed: {e}")
        return False

# Test connection first
connection_success = test_database_connection()

# Create the database URL
if connection_success:
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
    # PostgreSQL configuration with explicit IPv4 forcing
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
            "host": "db.qyydgmcfrfezdcejqxgo.supabase.co",
            "port": 5432,
            "sslmode": "prefer",
            "connect_timeout": 10,
            "application_name": "hfc_app",
            "client_encoding": "utf8"
        }
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

print(os.path.abspath('data/strategies.csv'))
print(os.path.exists('data/strategies.csv')) 