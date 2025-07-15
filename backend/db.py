import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get the original DATABASE_URL
original_url = os.getenv("DATABASE_URL")

# Convert to connection pooling URL (port 6543) with SSL
if original_url and "supabase.co" in original_url:
    # Try multiple connection strategies
    connection_strategies = []
    
    # Strategy 1: Connection pooling with SSL
    if ":5432" in original_url:
        strategy1 = original_url.replace(":5432", ":6543")
    else:
        strategy1 = original_url
    
    if "?" not in strategy1:
        strategy1 += "?sslmode=require&connect_timeout=10"
    else:
        strategy1 += "&sslmode=require&connect_timeout=10"
    
    connection_strategies.append(strategy1)
    
    # Strategy 2: Direct connection with different SSL mode
    if ":5432" in original_url:
        strategy2 = original_url.replace(":5432", ":6543")
    else:
        strategy2 = original_url
    
    if "?" not in strategy2:
        strategy2 += "?sslmode=prefer&connect_timeout=15"
    else:
        strategy2 += "&sslmode=prefer&connect_timeout=15"
    
    connection_strategies.append(strategy2)
    
    # Strategy 3: Try port 5432 with SSL
    strategy3 = original_url
    if "?" not in strategy3:
        strategy3 += "?sslmode=require&connect_timeout=10"
    else:
        strategy3 += "&sslmode=require&connect_timeout=10"
    
    connection_strategies.append(strategy3)
    
    # Use the first strategy for now
    SQLALCHEMY_DATABASE_URL = connection_strategies[0]
    
    print(f"Trying connection strategy: {SQLALCHEMY_DATABASE_URL}")
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