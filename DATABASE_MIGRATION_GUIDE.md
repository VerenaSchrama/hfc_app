# Database Migration Guide for HerFoodCode

## 📊 Current Database Status

Your application currently uses a **SQLite database** (`users.db`) with the following data:

### Database Size: 68KB (239 records)
- **Users**: Registered user accounts with email/password
- **Chat Messages**: User-bot conversation history
- **Tracked Symptoms**: User-specific symptom tracking
- **Daily Logs**: User progress and strategy application logs
- **Trial Periods**: Strategy trial period tracking

### Current Database Schema
```sql
-- Users table
users (id, email, hashed_password, created_at, current_strategy)

-- Chat messages
chat_messages (id, user_id, sender, text, timestamp)

-- Tracked symptoms
tracked_symptoms (id, user_id, symptom, order)

-- Daily logs
daily_logs (id, user_id, date, applied_strategy, energy, mood, symptom_scores, extra_symptoms, extra_notes, created_at, updated_at)

-- Trial periods
trial_periods (id, user_id, strategy_name, start_date, end_date, is_active, created_at, updated_at)
```

## 🚀 Render Deployment Database Options

### Option 1: SQLite with Persistent Disk (Recommended for Development)

**Pros**:
- ✅ Simple setup
- ✅ No additional costs
- ✅ Your existing data structure preserved
- ✅ Easy backup and restore

**Cons**:
- ⚠️ Limited concurrent users
- ⚠️ No built-in backup
- ⚠️ Not suitable for high-scale production

**Setup**:
1. **Mount SQLite Database**: Use Render persistent disk
2. **Database Path**: `/app/users.db`
3. **Data Persistence**: Survives container restarts

### Option 2: PostgreSQL (Recommended for Production)

**Pros**:
- ✅ Better performance
- ✅ Concurrent user support
- ✅ Built-in backup and recovery
- ✅ Scalable for production

**Cons**:
- ⚠️ Requires migration
- ⚠️ Additional cost ($7/month on Render)
- ⚠️ More complex setup

## 🔧 Implementation Guide

### Option 1: SQLite with Persistent Disk

#### Step 1: Update Docker Configuration
```dockerfile
# In backend/Dockerfile, ensure database directory exists
RUN mkdir -p /app/data && \
    chown -R appuser:appuser /app
```

#### Step 2: Update docker-compose.yml
```yaml
volumes:
  # Existing volumes
  - ./backend/data:/app/data
  - ./data/vectorstore:/app/data/vectorstore
  - ./data/processed:/app/data/processed
  # Add database volume
  - ./backend/users.db:/app/users.db
```

#### Step 3: Render Persistent Disk Configuration
```yaml
# In Render dashboard → Disks
Name: database-data
Mount Path: /app
Size: 1GB (includes database + other data)
```

#### Step 4: Database Backup Strategy
```bash
# Create backup script
#!/bin/bash
# backup-database.sh
cp /app/users.db /app/backup/users.db.$(date +%Y%m%d_%H%M%S)
```

### Option 2: PostgreSQL Migration

#### Step 1: Add PostgreSQL Dependencies
```python
# Add to requirements.txt
psycopg2-binary==2.9.9
```

#### Step 2: Update Database Configuration
```python
# backend/db.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use PostgreSQL in production, SQLite in development
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./users.db"
)

if DATABASE_URL.startswith("postgresql"):
    engine = create_engine(DATABASE_URL)
else:
    # SQLite configuration
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

#### Step 3: Create Migration Script
```python
# backend/migrate_to_postgres.py
import sqlite3
import psycopg2
from sqlalchemy import create_engine
from models import Base, User, ChatMessage, TrackedSymptom, DailyLog, TrialPeriod
from sqlalchemy.orm import sessionmaker
import os

def migrate_sqlite_to_postgres():
    """Migrate data from SQLite to PostgreSQL"""
    
    # Connect to SQLite
    sqlite_conn = sqlite3.connect('users.db')
    sqlite_cursor = sqlite_conn.cursor()
    
    # Connect to PostgreSQL
    postgres_url = os.getenv("DATABASE_URL")
    postgres_engine = create_engine(postgres_url)
    
    # Create tables in PostgreSQL
    Base.metadata.create_all(bind=postgres_engine)
    PostgresSession = sessionmaker(bind=postgres_engine)
    postgres_session = PostgresSession()
    
    try:
        # Migrate Users
        sqlite_cursor.execute("SELECT * FROM users")
        users = sqlite_cursor.fetchall()
        for user_data in users:
            user = User(
                id=user_data[0],
                email=user_data[1],
                hashed_password=user_data[2],
                created_at=user_data[3],
                current_strategy=user_data[4]
            )
            postgres_session.add(user)
        
        # Migrate Chat Messages
        sqlite_cursor.execute("SELECT * FROM chat_messages")
        messages = sqlite_cursor.fetchall()
        for msg_data in messages:
            message = ChatMessage(
                id=msg_data[0],
                user_id=msg_data[1],
                sender=msg_data[2],
                text=msg_data[3],
                timestamp=msg_data[4]
            )
            postgres_session.add(message)
        
        # Migrate Tracked Symptoms
        sqlite_cursor.execute("SELECT * FROM tracked_symptoms")
        symptoms = sqlite_cursor.fetchall()
        for symptom_data in symptoms:
            symptom = TrackedSymptom(
                id=symptom_data[0],
                user_id=symptom_data[1],
                symptom=symptom_data[2],
                order=symptom_data[3]
            )
            postgres_session.add(symptom)
        
        # Migrate Daily Logs
        sqlite_cursor.execute("SELECT * FROM daily_logs")
        logs = sqlite_cursor.fetchall()
        for log_data in logs:
            log = DailyLog(
                id=log_data[0],
                user_id=log_data[1],
                date=log_data[2],
                applied_strategy=log_data[3],
                energy=log_data[4],
                mood=log_data[5],
                symptom_scores=log_data[6],
                extra_symptoms=log_data[7],
                extra_notes=log_data[8],
                created_at=log_data[9],
                updated_at=log_data[10]
            )
            postgres_session.add(log)
        
        # Migrate Trial Periods
        sqlite_cursor.execute("SELECT * FROM trial_periods")
        trials = sqlite_cursor.fetchall()
        for trial_data in trials:
            trial = TrialPeriod(
                id=trial_data[0],
                user_id=trial_data[1],
                strategy_name=trial_data[2],
                start_date=trial_data[3],
                end_date=trial_data[4],
                is_active=trial_data[5],
                created_at=trial_data[6],
                updated_at=trial_data[7]
            )
            postgres_session.add(trial)
        
        # Commit all changes
        postgres_session.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        postgres_session.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        sqlite_conn.close()
        postgres_session.close()

if __name__ == "__main__":
    migrate_sqlite_to_postgres()
```

## 📋 Deployment Checklist

### For SQLite Option (Development)
- [ ] Database file included in repository or backup
- [ ] Persistent disk configured in Render
- [ ] Database path correctly mounted
- [ ] Backup strategy implemented
- [ ] Test database persistence after deployment

### For PostgreSQL Option (Production)
- [ ] PostgreSQL service created in Render
- [ ] Migration script tested locally
- [ ] Environment variables updated
- [ ] Database connection tested
- [ ] Data migration completed
- [ ] Old SQLite backup created

## 🔄 Migration Process

### Step 1: Backup Current Data
```bash
# Create backup of current database
cp backend/users.db backend/users.db.backup.$(date +%Y%m%d)
```

### Step 2: Test Migration Locally
```bash
# Set up local PostgreSQL (optional)
# Run migration script
python backend/migrate_to_postgres.py
```

### Step 3: Deploy with New Database
1. **Create PostgreSQL service in Render**
2. **Update environment variables**
3. **Deploy backend with new database URL**
4. **Run migration script in production**
5. **Verify data integrity**

## 🛡️ Data Safety Measures

### Backup Strategy
```bash
# Automated backup script
#!/bin/bash
# daily-backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/app/backups"

mkdir -p $BACKUP_DIR

# SQLite backup
cp /app/users.db $BACKUP_DIR/users.db.$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "users.db.*" -mtime +7 -delete
```

### Data Validation
```python
# backend/validate_migration.py
def validate_migration():
    """Validate that all data was migrated correctly"""
    
    # Count records in both databases
    sqlite_count = count_sqlite_records()
    postgres_count = count_postgres_records()
    
    if sqlite_count == postgres_count:
        print("✅ Migration validation passed!")
        return True
    else:
        print(f"❌ Migration validation failed: {sqlite_count} vs {postgres_count}")
        return False
```

## 💰 Cost Comparison

### SQLite Option
- **Cost**: $0 (included in free tier)
- **Storage**: 1GB persistent disk
- **Limitations**: Single connection, no concurrent users

### PostgreSQL Option
- **Cost**: $7/month (Render PostgreSQL)
- **Storage**: 1GB included, $0.25/GB additional
- **Benefits**: Concurrent users, built-in backups, better performance

## 🎯 Recommendation

### For Development/Testing
**Use SQLite with persistent disk** - Simple, free, sufficient for development

### For Production
**Use PostgreSQL** - Better performance, scalability, and reliability

### Migration Timeline
1. **Phase 1**: Deploy with SQLite for initial launch
2. **Phase 2**: Migrate to PostgreSQL when user base grows
3. **Phase 3**: Implement automated backups and monitoring

## 📞 Support

- **SQLite Issues**: Check persistent disk mounting
- **PostgreSQL Issues**: Check connection string and credentials
- **Migration Issues**: Use validation script to verify data integrity
- **Backup Issues**: Implement automated backup monitoring

---

**Current Database**: 68KB SQLite with 239 records
**Recommended Approach**: Start with SQLite, migrate to PostgreSQL when needed
**Migration Complexity**: Low (automated script available)
**Data Safety**: High (backup strategy included) 