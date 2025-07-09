from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from db import engine

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

def create_db_and_tables():
    Base.metadata.create_all(bind=engine) 