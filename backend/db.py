from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Get the original DATABASE_URL
original_url = os.getenv("DATABASE_URL")

# Convert to connection pooling URL (port 6543)
if original_url and "supabase.co" in original_url:
    # Replace port 5432 with 6543 for connection pooling
    SQLALCHEMY_DATABASE_URL = original_url.replace(":5432", ":6543")
else:
    SQLALCHEMY_DATABASE_URL = original_url

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

print(os.path.abspath('data/strategies.csv'))
print(os.path.exists('data/strategies.csv')) 