# python main.py
from fastapi import FastAPI, Depends, HTTPException, status, Request, Body, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from rag_pipeline import get_strategies, get_advice, generate_advice
import os
import urllib.parse
from models import create_db_and_tables, User, ChatMessage, TrackedSymptom, DailyLog, TrialPeriod
from sqlalchemy.orm import Session
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

create_db_and_tables()

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

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

# Make get_current_user async and use await security(request)
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    auth: HTTPAuthorizationCredentials = await security(request)
    token = auth.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get('sub')
        if not email:
            raise HTTPException(status_code=401, detail='Invalid token')
        user = db.query(User).filter(User.email == email).first()
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
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    db_user = User(email=user.email, hashed_password=hashed_pw.decode('utf-8'))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    # Create JWT
    access_token = jwt.encode({
        "sub": db_user.email,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/v1/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not bcrypt.checkpw(user.password.encode('utf-8'), db_user.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = jwt.encode({
        "sub": db_user.email,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": access_token, "token_type": "bearer"}

@app.delete('/api/v1/delete_account')
async def delete_account(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    db.delete(user)
    db.commit()
    return {"detail": "Account deleted"}

@app.post('/api/v1/set_strategy')
async def set_strategy(request: Request, db: Session = Depends(get_db), data: dict = Body(...)):
    user = await get_current_user(request, db)
    strategy_name = data.get('strategy_name')
    trial_period = data.get('trial_period')  # Optional trial period data
    
    if not strategy_name:
        raise HTTPException(status_code=400, detail='No strategy_name provided')
    
    # Update current strategy
    user.current_strategy = strategy_name
    
    # If trial period data is provided, create a new trial period
    if trial_period:
        try:
            start_date = dt.strptime(trial_period['start_date'], "%Y-%m-%d").date()
            end_date = dt.strptime(trial_period['end_date'], "%Y-%m-%d").date()
            
            # Deactivate any existing active trial periods
            existing_trials = db.query(TrialPeriod).filter_by(user_id=user.id, is_active=True).all()
            for trial in existing_trials:
                trial.is_active = False
            
            # Create new trial period
            new_trial = TrialPeriod(
                user_id=user.id,
                strategy_name=strategy_name,
                start_date=start_date,
                end_date=end_date,
                is_active=True
            )
            db.add(new_trial)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f'Invalid trial period data: {str(e)}')
    else:
        # If no trial period provided, ensure current_strategy matches active trial period
        active_trial = db.query(TrialPeriod).filter_by(user_id=user.id, is_active=True).first()
        if active_trial and active_trial.strategy_name != strategy_name:
            # Update the active trial period to match the new strategy
            active_trial.strategy_name = strategy_name
    
    db.commit()
    return {"detail": "Strategy updated"}

@app.post('/api/v1/chat')
async def chat(request: Request, data: ChatRequest, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    # 1. Retrieve symptoms
    symptoms = [s.symptom for s in db.query(TrackedSymptom).filter_by(user_id=user.id).order_by(TrackedSymptom.order).all()]
    # 2. Retrieve all logs
    logs = db.query(DailyLog).filter_by(user_id=user.id).order_by(DailyLog.date).all()
    logs_summary = []
    for log in logs:
        logs_summary.append({
            'date': log.date.isoformat(),
            'applied_strategy': log.applied_strategy,
            'energy': log.energy,
            'mood': log.mood,
            'symptom_scores': log.symptom_scores,
            'extra_symptoms': log.extra_symptoms,
            'extra_notes': log.extra_notes
        })
    # 3. Retrieve current strategy details
    strategy_details = None
    if user.current_strategy:
        details = strategies_df[strategies_df['Strategie naam'] == user.current_strategy]
        if not details.empty:
            strategy_details = details.to_dict(orient='records')[0]
    # 4. Build user profile context
    user_profile_context = f"""
User Profile:
- Email: {user.email}
- Symptoms: {', '.join(symptoms) if symptoms else 'None'}
- Goals: {getattr(user, 'goals', 'None')}
- Current Strategy: {user.current_strategy or 'None'}
- Strategy Details: {strategy_details if strategy_details else 'None'}
- Progress/Logs: {logs_summary if logs_summary else 'None'}
"""
    # 5. Retrieve chat history
    chat_history = db.query(ChatMessage).filter(ChatMessage.user_id == user.id).order_by(ChatMessage.timestamp).all()
    history = [(msg.sender, msg.text) for msg in chat_history]
    # 6. Append new user message
    user_msg = ChatMessage(user_id=user.id, sender='user', text=data.question, timestamp=datetime.utcnow())
    db.add(user_msg)
    db.commit()
    # 7. Call RAG LLM with user profile context, chat history, and question
    rag_input = {
        'user_profile': user_profile_context,
        'chat_history': history,
        'question': data.question
    }
    result = generate_advice(rag_input)
    answer = result['answer'] if isinstance(result, dict) else result
    # 8. Store bot response
    bot_msg = ChatMessage(user_id=user.id, sender='bot', text=answer, timestamp=datetime.utcnow())
    db.add(bot_msg)
    db.commit()
    # 9. Return updated chat history
    updated_history = db.query(ChatMessage).filter(ChatMessage.user_id == user.id).order_by(ChatMessage.timestamp).all()
    return {'history': [{'sender': m.sender, 'text': m.text, 'timestamp': m.timestamp.isoformat()} for m in updated_history]}

# --- Trial Period Endpoints ---
@app.get('/api/v1/trial_periods')
async def get_trial_periods(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    trials = db.query(TrialPeriod).filter_by(user_id=user.id).order_by(TrialPeriod.start_date.desc()).all()
    return [
        {
            "id": trial.id,
            "strategy_name": trial.strategy_name,
            "start_date": trial.start_date.isoformat(),
            "end_date": trial.end_date.isoformat(),
            "is_active": trial.is_active,
            "created_at": trial.created_at.isoformat()
        }
        for trial in trials
    ]

@app.post('/api/v1/trial_periods')
async def create_trial_period(request: Request, trial_data: TrialPeriodCreate, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    
    try:
        start_date = dt.strptime(trial_data.start_date, "%Y-%m-%d").date()
        end_date = dt.strptime(trial_data.end_date, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    if start_date >= end_date:
        raise HTTPException(status_code=400, detail="End date must be after start date.")
    
    # Deactivate any existing active trial periods
    existing_trials = db.query(TrialPeriod).filter_by(user_id=user.id, is_active=True).all()
    for trial in existing_trials:
        trial.is_active = False
    
    # Create new trial period
    new_trial = TrialPeriod(
        user_id=user.id,
        strategy_name=trial_data.strategy_name,
        start_date=start_date,
        end_date=end_date,
        is_active=True
    )
    db.add(new_trial)
    db.commit()
    
    return {
        "id": new_trial.id,
        "strategy_name": new_trial.strategy_name,
        "start_date": new_trial.start_date.isoformat(),
        "end_date": new_trial.end_date.isoformat(),
        "is_active": new_trial.is_active
    }

# --- Tracked Symptoms Endpoints ---
@app.get('/api/v1/symptoms')
async def get_symptoms(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    symptoms = db.query(TrackedSymptom).filter_by(user_id=user.id).order_by(TrackedSymptom.order).all()
    return [s.symptom for s in symptoms]

@app.post('/api/v1/symptoms')
async def set_symptoms(request: Request, symptoms: list[str] = Body(...), db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    db.query(TrackedSymptom).filter_by(user_id=user.id).delete()
    for i, s in enumerate(symptoms):
        db.add(TrackedSymptom(user_id=user.id, symptom=s, order=i))
    db.commit()
    return {"success": True}

# --- Daily Log Endpoints ---
@app.get('/api/v1/logs/today')
async def get_today_log(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    today = date.today()
    log = db.query(DailyLog).filter_by(user_id=user.id, date=today).first()
    return log

@app.post('/api/v1/logs/today')
async def upsert_today_log(request: Request, log_data: dict = Body(...), db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    today = date.today()
    
    # Remove 'date' and 'strategy_name' from log_data to avoid duplicate/invalid argument errors
    log_data.pop('date', None)
    log_data.pop('strategy_name', None)
    
    # Require applied_strategy
    if 'applied_strategy' not in log_data or log_data['applied_strategy'] is None:
        raise HTTPException(status_code=400, detail="applied_strategy is required and cannot be null.")
    
    log = db.query(DailyLog).filter_by(user_id=user.id, date=today).first()
    if log:
        for k, v in log_data.items():
            setattr(log, k, v)
    else:
        log = DailyLog(user_id=user.id, date=today, **log_data)
        db.add(log)
    db.commit()
    return {"success": True}

# --- Edit a Past Log ---
@app.patch('/api/v1/logs/{log_date}')
async def edit_log(request: Request, log_date: str = Path(...), log_data: dict = Body(...), db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    try:
        log_date_obj = dt.strptime(log_date, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    log = db.query(DailyLog).filter_by(user_id=user.id, date=log_date_obj).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found for this date.")
    for k, v in log_data.items():
        setattr(log, k, v)
    db.commit()
    return {"success": True}

# --- Date Range Log Fetch ---
@app.get('/api/v1/logs')
async def get_logs_range(request: Request, start: Optional[str] = Query(None), end: Optional[str] = Query(None), db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    query = db.query(DailyLog).filter_by(user_id=user.id)
    if start:
        try:
            start_date = dt.strptime(start, "%Y-%m-%d").date()
            query = query.filter(DailyLog.date >= start_date)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid start date format. Use YYYY-MM-DD.")
    if end:
        try:
            end_date = dt.strptime(end, "%Y-%m-%d").date()
            query = query.filter(DailyLog.date <= end_date)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid end date format. Use YYYY-MM-DD.")
    logs = query.all()
    return logs

@app.get('/api/v1/profile')
async def get_profile(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    strategy_details = None
    if user.current_strategy:
        details = strategies_df[strategies_df['Strategie naam'] == user.current_strategy]
        if not details.empty:
            strategy_details = details.to_dict(orient='records')[0]
    
    # Get active trial period for debugging
    active_trial = db.query(TrialPeriod).filter_by(user_id=user.id, is_active=True).first()
    
    return {
        "email": user.email,
        "current_strategy": user.current_strategy,
        "strategy_details": strategy_details,
        "active_trial_period": {
            "strategy_name": active_trial.strategy_name if active_trial else None,
            "start_date": active_trial.start_date.isoformat() if active_trial else None,
            "end_date": active_trial.end_date.isoformat() if active_trial else None,
            "is_active": active_trial.is_active if active_trial else None
        } if active_trial else None,
        # Add more fields as needed
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
