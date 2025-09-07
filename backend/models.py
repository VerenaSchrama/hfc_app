from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from db import engine, supabase, supabase_connected

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    current_strategy = Column(String, nullable=True)

class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    sender = Column(String, nullable=False)  # 'user' or 'bot'
    text = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class TrackedSymptom(Base):
    __tablename__ = 'tracked_symptoms'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    symptom = Column(String, nullable=False)
    order = Column(Integer, default=0)

class DailyLog(Base):
    __tablename__ = 'daily_logs'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    date = Column(Date, nullable=False)
    applied_strategy = Column(Boolean, nullable=False)
    energy = Column(Integer, nullable=False)
    mood = Column(Integer, nullable=False)
    symptom_scores = Column(JSON, nullable=False)  # {symptom: score}
    extra_symptoms = Column(String)
    extra_notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TrialPeriod(Base):
    __tablename__ = 'trial_periods'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    strategy_name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ===== WORKBOOK MODELS =====

class Mechanism(Base):
    __tablename__ = 'mechanisms'
    id = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    user_notes = Column(String, nullable=True)
    confidence_score = Column(Integer, nullable=True)  # 0-100
    source = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'user_notes': self.user_notes,
            'confidence_score': self.confidence_score,
            'source': self.source,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Intervention(Base):
    __tablename__ = 'interventions'
    id = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    mechanism_id = Column(String, ForeignKey('mechanisms.id'), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    user_notes = Column(String, nullable=True)
    is_tracking = Column(Boolean, default=False)
    tracking_frequency = Column(String, nullable=True)  # 'daily', 'weekly', 'as_needed'
    confidence_score = Column(Integer, nullable=True)  # 0-100
    source = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'mechanism_id': self.mechanism_id,
            'title': self.title,
            'description': self.description,
            'user_notes': self.user_notes,
            'is_tracking': self.is_tracking,
            'tracking_frequency': self.tracking_frequency,
            'confidence_score': self.confidence_score,
            'source': self.source,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class DailyReflection(Base):
    __tablename__ = 'daily_reflections'
    id = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    date = Column(Date, nullable=False)
    energy_level = Column(Integer, nullable=False)  # 1-10
    mood = Column(Integer, nullable=False)  # 1-10
    symptoms = Column(JSON, nullable=False)  # {symptom_name: severity_score}
    notes = Column(String, nullable=False)
    interventions_applied = Column(JSON, nullable=False)  # Array of intervention IDs
    additional_notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat() if self.date else None,
            'energy_level': self.energy_level,
            'mood': self.mood,
            'symptoms': self.symptoms,
            'notes': self.notes,
            'interventions_applied': self.interventions_applied,
            'additional_notes': self.additional_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class WorkbookEntry(Base):
    __tablename__ = 'workbook_entries'
    id = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    type = Column(String, nullable=False)  # 'mechanism', 'intervention', 'reflection', 'insight'
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    user_notes = Column(String, nullable=True)
    source = Column(String, nullable=True)  # 'rag', 'user', 'chat', 'upload'
    tags = Column(JSON, nullable=True)  # Array of strings
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ArchiveItem(Base):
    __tablename__ = 'archive_items'
    id = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'screenshot', 'article', 'text', 'insight'
    source_url = Column(String, nullable=True)
    ai_insights = Column(String, nullable=True)
    suggested_mechanisms = Column(JSON, nullable=True)  # Array of strings
    suggested_interventions = Column(JSON, nullable=True)  # Array of strings
    tags = Column(JSON, nullable=True)  # Array of strings
    created_at = Column(DateTime, default=datetime.utcnow)

def create_db_and_tables():
    """Create database tables"""
    if supabase_connected:
        # Using Supabase - tables managed through Supabase dashboard
        # Make sure the following tables exist in your Supabase project:
        # - users
        # - chat_messages
        # - tracked_symptoms
        # - daily_logs
        # - trial_periods
        pass
    else:
        # Create SQLite tables
        Base.metadata.create_all(bind=engine) 