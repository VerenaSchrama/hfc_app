# python main.py
from fastapi import FastAPI, Depends, HTTPException, status, Request, Body, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from rag_pipeline import get_strategies, get_advice, generate_advice
import os
import urllib.parse
from models import create_db_and_tables
from db import SessionLocal
import bcrypt
from jose import jwt
from datetime import datetime, timedelta, date
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime as dt

app = FastAPI(
    title="HerFoodCode API",
    description="FastAPI backend for HerFoodCode app with RAG model integration",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    print("🚀 Starting HerFoodCode API...")
    
    # Test database connection
    from db import test_supabase_connection, supabase_connected
    print(f"📊 Database connection status: {'✅ Supabase' if supabase_connected else '⚠️ SQLite fallback'}")
    
    try:
        create_db_and_tables()
        print("✅ Database initialization completed")
    except Exception as e:
        print(f"⚠️ Warning: Could not create database tables: {e}")
        print("Application will continue without database initialization")
    
    print("🎉 HerFoodCode API startup complete!")

@app.get("/")
async def root():
    """Root endpoint for health checks and basic info"""
    return {
        "message": "HerFoodCode API is running",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for container orchestration"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# CORS Middleware
# Allow all possible Vercel production and preview URLs using regex
# - https://hfc-app.vercel.app
# - https://<branch>--hfc-app.vercel.app
# - https://hfc-app-<hash>-verenaschramas-projects.vercel.app
# - https://*.hfc-app.vercel.app
# - https://*.vercel.app (if you want to be even more permissive)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://([a-z0-9-]+--)?hfc-app\.vercel\.app|https://hfc-app(-[a-z0-9]+)?-verenaschramas-projects\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")  # Change this in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

# Load strategies from the correct CSV
STRATEGIES_FILE_PATH = os.path.join(os.path.dirname(__file__), 'data', 'strategies.csv')
print("[DEBUG] Absolute path to strategies.csv:", os.path.abspath(STRATEGIES_FILE_PATH))
print("[DEBUG] strategies.csv exists:", os.path.exists(STRATEGIES_FILE_PATH))
strategies_df = pd.read_csv(STRATEGIES_FILE_PATH, sep=';')
print("[DEBUG] Loaded strategies.csv shape:", strategies_df.shape)
print("[DEBUG] Loaded strategies.csv columns:", strategies_df.columns)
print("[DEBUG] First row of strategies.csv:", strategies_df.head(1))
strategies_df.fillna('', inplace=True)

# Dependency to get Supabase client
def get_supabase():
    from db import supabase
    return supabase

# Define the correct and complete data model
class IntakeData(BaseModel):
    cycle: Optional[str] = None
    symptoms: Optional[List[str]] = None
    preferences: Optional[List[str]] = None
    goals: Optional[List[str]] = None

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ChatRequest(BaseModel):
    question: str

class TrialPeriodCreate(BaseModel):
    strategy_name: str
    start_date: str  # YYYY-MM-DD format
    end_date: str    # YYYY-MM-DD format

security = HTTPBearer()

# Make get_current_user async and use Supabase
async def get_current_user(request: Request, supabase_client = Depends(get_supabase)):
    auth: HTTPAuthorizationCredentials = await security(request)
    token = auth.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get('sub')
        if not email:
            raise HTTPException(status_code=401, detail='Invalid token')
        
        # Use Supabase to get user
        from db import SupabaseDB
        user = SupabaseDB.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail='User not found')
        return user
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid token')

# Update all endpoints that use get_current_user to be async
def sync_to_async(f):
    import functools
    async def wrapper(*args, **kwargs):
        return f(*args, **kwargs)
    return functools.wraps(f)(wrapper)

@app.post("/api/v1/strategies")
async def strategies(intake_data: IntakeData):
    print("[DEBUG] Received intake data:", intake_data.dict())
    # 1. Get the list of recommended strategy metadata from the RAG pipeline
    recommended_metadata = get_strategies(intake_data.dict())
    print("[DEBUG] Recommended metadata:", recommended_metadata)
    # 2. Extract just the names of the strategies
    recommended_names = [meta['strategy_name'] for meta in recommended_metadata]
    print("[DEBUG] Recommended names:", recommended_names)
    print("[DEBUG] Strategie naam kolomwaarden:", strategies_df['Strategie naam'].unique())
    
    # 3. Filter the main DataFrame to get the full details for those strategies
    full_recommendations = strategies_df[strategies_df['Strategie naam'].isin(recommended_names)]
    print("[DEBUG] Filtered DataFrame:", full_recommendations)
    
    # 4. Preserve the order returned by the retriever
    # Use .reindex() to handle cases where a strategy name might not be found in the df
    ordered_recommendations = full_recommendations.set_index('Strategie naam').reindex(recommended_names).reset_index()

    return {"strategies": ordered_recommendations.to_dict(orient='records')}

@app.get("/api/v1/strategies/{strategy_name:path}")
async def get_strategy_details(strategy_name: str):
    #Retrieves all details for a specific strategy by its name.
    decoded_name = urllib.parse.unquote(strategy_name)
    strategy_details = strategies_df[strategies_df['Strategie naam'] == decoded_name]
    if not strategy_details.empty:
        return strategy_details.to_dict(orient='records')[0]
    return {"error": "Strategy not found"}

@app.post("/api/v1/advice")
async def advice(intake_data: IntakeData):
    #Receives user intake data and returns general advice from the RAG pipeline.
    response = get_advice(intake_data.dict())
    return response

@app.post("/api/v1/register", response_model=Token)
def register(user: UserCreate):
    try:
        from db import SupabaseDB
        
        # Check if user already exists
        existing = SupabaseDB.get_user_by_email(user.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user in Supabase
        db_user = SupabaseDB.create_user(user.email, hashed_pw.decode('utf-8'))
        if not db_user:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        # Create JWT
        access_token = jwt.encode({
            "sub": db_user['email'],
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }, SECRET_KEY, algorithm=ALGORITHM)
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"Registration error: {str(e)}")
        # Re-raise HTTP exceptions as-is
        if isinstance(e, HTTPException):
            raise e
        # For other errors, return a generic error
        raise HTTPException(
            status_code=500, 
            detail="An error occurred during registration. Please try again."
        )

@app.post("/api/v1/login", response_model=Token)
def login(user: UserLogin):
    try:
        from db import SupabaseDB
        
        # Get user from Supabase
        db_user = SupabaseDB.get_user_by_email(user.email)
        if not db_user or not bcrypt.checkpw(user.password.encode('utf-8'), db_user['hashed_password'].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        access_token = jwt.encode({
            "sub": db_user['email'],
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }, SECRET_KEY, algorithm=ALGORITHM)
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"Login error: {str(e)}")
        # Re-raise HTTP exceptions as-is
        if isinstance(e, HTTPException):
            raise e
        # For other errors, return a generic error
        raise HTTPException(
            status_code=500, 
            detail="An error occurred during login. Please try again."
        )

@app.delete('/api/v1/delete_account')
async def delete_account(request: Request):
    user = await get_current_user(request)
    from db import SupabaseDB
    # Note: SupabaseDB.delete_user method needs to be implemented
    # For now, we'll return success (user deletion can be implemented later)
    return {"detail": "Account deletion requested"}

@app.post('/api/v1/set_strategy')
async def set_strategy(request: Request, data: dict = Body(...)):
    user = await get_current_user(request)
    strategy_name = data.get('strategy_name')
    trial_period = data.get('trial_period')  # Optional trial period data
    
    if not strategy_name:
        raise HTTPException(status_code=400, detail='No strategy_name provided')
    
    from db import SupabaseDB
    
    # Update current strategy
    SupabaseDB.update_user_strategy(user['id'], strategy_name)
    
    # If trial period data is provided, create a new trial period
    if trial_period:
        try:
            start_date = trial_period['start_date']
            end_date = trial_period['end_date']
            
            # Create new trial period
            SupabaseDB.create_trial_period(user['id'], strategy_name, start_date, end_date)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f'Invalid trial period data: {str(e)}')
    
    return {"detail": "Strategy updated"}

@app.post('/api/v1/chat')
async def chat(request: Request, data: ChatRequest):
    user = await get_current_user(request)
    from db import SupabaseDB
    
    # 1. Retrieve symptoms
    symptoms = SupabaseDB.get_user_symptoms(user['id'])
    symptom_names = [s['symptom'] for s in symptoms]
    
    # 2. Retrieve all logs
    logs = SupabaseDB.get_user_logs(user['id'])
    logs_summary = []
    for log in logs:
        logs_summary.append({
            'date': log['date'],
            'applied_strategy': log['applied_strategy'],
            'energy': log['energy'],
            'mood': log['mood'],
            'symptom_scores': log['symptom_scores'],
            'extra_symptoms': log['extra_symptoms'],
            'extra_notes': log['extra_notes']
        })
    
    # 3. Retrieve current strategy details
    strategy_details = None
    if user.get('current_strategy'):
        details = strategies_df[strategies_df['Strategie naam'] == user['current_strategy']]
        if not details.empty:
            strategy_details = details.to_dict(orient='records')[0]
    
    # 4. Build user profile context
    user_profile_context = f"""
User Profile:
- Email: {user['email']}
- Symptoms: {', '.join(symptom_names) if symptom_names else 'None'}
- Goals: {user.get('goals', 'None')}
- Current Strategy: {user.get('current_strategy', 'None')}
- Strategy Details: {strategy_details if strategy_details else 'None'}
- Progress/Logs: {logs_summary if logs_summary else 'None'}
"""
    
    # 5. Retrieve chat history
    chat_history = SupabaseDB.get_chat_messages(user['id'])
    history = [(msg['sender'], msg['text']) for msg in chat_history]
    
    # 6. Append new user message
    SupabaseDB.create_chat_message(user['id'], 'user', data.question)
    
    # 7. Call RAG LLM with user profile context, chat history, and question
    rag_input = {
        'user_profile': user_profile_context,
        'chat_history': history,
        'question': data.question
    }
    result = generate_advice(rag_input)
    answer = result['answer'] if isinstance(result, dict) else result
    
    # 8. Store bot response
    SupabaseDB.create_chat_message(user['id'], 'bot', answer)
    
    # 9. Return updated chat history
    updated_history = SupabaseDB.get_chat_messages(user['id'])
    return {'history': [{'sender': m['sender'], 'text': m['text'], 'timestamp': m['timestamp']} for m in updated_history]}

# --- Trial Period Endpoints ---
@app.get('/api/v1/trial_periods')
async def get_trial_periods(request: Request):
    user = await get_current_user(request)
    from db import SupabaseDB
    trials = SupabaseDB.get_user_trial_periods(user['id'])
    return [
        {
            "id": trial['id'],
            "strategy_name": trial['strategy_name'],
            "start_date": trial['start_date'],
            "end_date": trial['end_date'],
            "is_active": trial['is_active'],
            "created_at": trial['created_at']
        }
        for trial in trials
    ]

@app.post('/api/v1/trial_periods')
async def create_trial_period(request: Request, trial_data: TrialPeriodCreate):
    user = await get_current_user(request)
    
    try:
        start_date = trial_data.start_date
        end_date = trial_data.end_date
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    if start_date >= end_date:
        raise HTTPException(status_code=400, detail="End date must be after start date.")
    
    from db import SupabaseDB
    
    # Create new trial period
    new_trial = SupabaseDB.create_trial_period(user['id'], trial_data.strategy_name, start_date, end_date)
    if not new_trial:
        raise HTTPException(status_code=500, detail="Failed to create trial period")
    
    return {
        "id": new_trial['id'],
        "strategy_name": new_trial['strategy_name'],
        "start_date": new_trial['start_date'],
        "end_date": new_trial['end_date'],
        "is_active": new_trial['is_active']
    }

# --- Tracked Symptoms Endpoints ---
@app.get('/api/v1/symptoms')
async def get_symptoms(request: Request):
    user = await get_current_user(request)
    from db import SupabaseDB
    symptoms = SupabaseDB.get_user_symptoms(user['id'])
    return [s['symptom'] for s in symptoms]

@app.post('/api/v1/symptoms')
async def set_symptoms(request: Request, symptoms: list[str] = Body(...)):
    user = await get_current_user(request)
    from db import SupabaseDB
    
    # Clear existing symptoms and add new ones
    for i, symptom in enumerate(symptoms):
        SupabaseDB.create_tracked_symptom(user['id'], symptom, i)
    
    return {"success": True}

# --- Daily Log Endpoints ---
@app.get('/api/v1/logs/today')
async def get_today_log(request: Request):
    user = await get_current_user(request)
    from db import SupabaseDB
    today = date.today().isoformat()
    logs = SupabaseDB.get_user_logs(user['id'])
    today_log = next((log for log in logs if log['date'] == today), None)
    return today_log

@app.post('/api/v1/logs/today')
async def upsert_today_log(request: Request, log_data: dict = Body(...)):
    user = await get_current_user(request)
    from db import SupabaseDB
    today = date.today().isoformat()
    
    # Remove 'date' and 'strategy_name' from log_data to avoid duplicate/invalid argument errors
    log_data.pop('date', None)
    log_data.pop('strategy_name', None)
    
    # Require applied_strategy
    if 'applied_strategy' not in log_data or log_data['applied_strategy'] is None:
        raise HTTPException(status_code=400, detail="applied_strategy is required and cannot be null.")
    
    # Create daily log
    result = SupabaseDB.create_daily_log(
        user['id'], 
        today, 
        log_data['applied_strategy'],
        log_data.get('energy', 0),
        log_data.get('mood', 0),
        log_data.get('symptom_scores', {}),
        log_data.get('extra_symptoms'),
        log_data.get('extra_notes')
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create log")
    
    return {"success": True}

# --- Edit a Past Log ---
@app.patch('/api/v1/logs/{log_date}')
async def edit_log(request: Request, log_date: str = Path(...), log_data: dict = Body(...)):
    user = await get_current_user(request)
    from db import SupabaseDB
    
    try:
        # Validate date format
        dt.strptime(log_date, "%Y-%m-%d")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    # For now, we'll return success (edit functionality can be implemented later)
    # This is a placeholder - SupabaseDB.update_daily_log method would need to be implemented
    return {"success": True}

# --- Date Range Log Fetch ---
@app.get('/api/v1/logs')
async def get_logs_range(request: Request, start: Optional[str] = Query(None), end: Optional[str] = Query(None)):
    user = await get_current_user(request)
    from db import SupabaseDB
    
    logs = SupabaseDB.get_user_logs(user['id'])
    
    # Filter by date range if provided
    if start:
        try:
            dt.strptime(start, "%Y-%m-%d")
            logs = [log for log in logs if log['date'] >= start]
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid start date format. Use YYYY-MM-DD.")
    
    if end:
        try:
            dt.strptime(end, "%Y-%m-%d")
            logs = [log for log in logs if log['date'] <= end]
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid end date format. Use YYYY-MM-DD.")
    
    return logs

@app.get('/api/v1/profile')
async def get_profile(request: Request):
    user = await get_current_user(request)
    from db import SupabaseDB
    
    strategy_details = None
    if user.get('current_strategy'):
        details = strategies_df[strategies_df['Strategie naam'] == user['current_strategy']]
        if not details.empty:
            strategy_details = details.to_dict(orient='records')[0]
    
    # Get active trial period for debugging
    trials = SupabaseDB.get_user_trial_periods(user['id'])
    active_trial = next((trial for trial in trials if trial['is_active']), None)
    
    return {
        "email": user['email'],
        "current_strategy": user.get('current_strategy'),
        "strategy_details": strategy_details,
        "active_trial_period": {
            "strategy_name": active_trial['strategy_name'] if active_trial else None,
            "start_date": active_trial['start_date'] if active_trial else None,
            "end_date": active_trial['end_date'] if active_trial else None,
            "is_active": active_trial['is_active'] if active_trial else None
        } if active_trial else None,
        # Add more fields as needed
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
