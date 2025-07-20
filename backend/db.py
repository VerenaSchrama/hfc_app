import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from supabase import create_client, Client
from typing import Optional, Dict, Any, List

# Load environment variables
load_dotenv()

# Validate required environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY]):
    raise ValueError("Missing required Supabase environment variables")

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def test_supabase_connection():
    """Test Supabase client connection"""
    try:
        print("Testing Supabase connection...")
        # Test with a simple query to check if connection works
        response = supabase.table('users').select('id').limit(1).execute()
        print("✅ Supabase connection successful!")
        return True
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False

# Test connection
supabase_connected = test_supabase_connection()

# Configure database based on connection status
if supabase_connected:
    print("✅ Using Supabase database (HTTP API)")
    # No SQLAlchemy engine needed for Supabase - we use the client directly
    engine = None
    SQLALCHEMY_DATABASE_URL = "supabase://http-api"
else:
    # Fallback to SQLite
    SQLALCHEMY_DATABASE_URL = "sqlite:///./users.db"
    print("⚠️ Using SQLite fallback - data won't persist in production")
    
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )

# Create session maker (only for SQLite fallback)
if engine:
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    SessionLocal = None

# Create base model (only for SQLite fallback)
Base = declarative_base()

print(f"Database configured: {'Supabase (HTTP API)' if supabase_connected else 'SQLite'}")

# Supabase database operations functions
class SupabaseDB:
    """Database operations using Supabase client"""
    
    @staticmethod
    def create_user(email: str, hashed_password: str, current_strategy: Optional[str] = None) -> Dict[str, Any]:
        """Create a new user"""
        try:
            data = {
                "email": email,
                "hashed_password": hashed_password,
                "current_strategy": current_strategy
            }
            response = supabase.table('users').insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error creating user: {e}")
            return None
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            response = supabase.table('users').select('*').eq('email', email).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error getting user by email: {e}")
            return None
    
    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            response = supabase.table('users').select('*').eq('id', user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error getting user by ID: {e}")
            return None
    
    @staticmethod
    def update_user_strategy(user_id: int, strategy: str) -> bool:
        """Update user's current strategy"""
        try:
            supabase.table('users').update({"current_strategy": strategy}).eq('id', user_id).execute()
            return True
        except Exception as e:
            print(f"Error updating user strategy: {e}")
            return False
    
    @staticmethod
    def create_chat_message(user_id: int, sender: str, text: str) -> Optional[Dict[str, Any]]:
        """Create a new chat message"""
        try:
            data = {
                "user_id": user_id,
                "sender": sender,
                "text": text
            }
            response = supabase.table('chat_messages').insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error creating chat message: {e}")
            return None
    
    @staticmethod
    def get_chat_messages(user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Get chat messages for a user"""
        try:
            response = supabase.table('chat_messages').select('*').eq('user_id', user_id).order('timestamp', desc=True).limit(limit).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting chat messages: {e}")
            return []
    
    @staticmethod
    def create_trial_period(user_id: int, strategy_name: str, start_date: str, end_date: str) -> Optional[Dict[str, Any]]:
        """Create a new trial period"""
        try:
            data = {
                "user_id": user_id,
                "strategy_name": strategy_name,
                "start_date": start_date,
                "end_date": end_date,
                "is_active": True
            }
            response = supabase.table('trial_periods').insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error creating trial period: {e}")
            return None
    
    @staticmethod
    def get_user_trial_periods(user_id: int) -> List[Dict[str, Any]]:
        """Get trial periods for a user"""
        try:
            response = supabase.table('trial_periods').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting trial periods: {e}")
            return []
    
    @staticmethod
    def create_daily_log(user_id: int, date: str, applied_strategy: bool, energy: int, mood: int, 
                        symptom_scores: Dict[str, int], extra_symptoms: Optional[str] = None, 
                        extra_notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Create a new daily log"""
        try:
            data = {
                "user_id": user_id,
                "date": date,
                "applied_strategy": applied_strategy,
                "energy": energy,
                "mood": mood,
                "symptom_scores": symptom_scores,
                "extra_symptoms": extra_symptoms,
                "extra_notes": extra_notes
            }
            response = supabase.table('daily_logs').insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error creating daily log: {e}")
            return None
    
    @staticmethod
    def get_user_logs(user_id: int, limit: int = 30) -> List[Dict[str, Any]]:
        """Get daily logs for a user"""
        try:
            response = supabase.table('daily_logs').select('*').eq('user_id', user_id).order('date', desc=True).limit(limit).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting daily logs: {e}")
            return []
    
    @staticmethod
    def create_tracked_symptom(user_id: int, symptom: str, order: int = 0) -> Optional[Dict[str, Any]]:
        """Create a tracked symptom"""
        try:
            data = {
                "user_id": user_id,
                "symptom": symptom,
                "order": order
            }
            response = supabase.table('tracked_symptoms').insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error creating tracked symptom: {e}")
            return None
    
    @staticmethod
    def get_user_symptoms(user_id: int) -> List[Dict[str, Any]]:
        """Get tracked symptoms for a user"""
        try:
            response = supabase.table('tracked_symptoms').select('*').eq('user_id', user_id).order('order').execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting tracked symptoms: {e}")
            return []

print(os.path.abspath('data/strategies.csv'))
print(os.path.exists('data/strategies.csv')) 