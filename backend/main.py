# python main.py
from fastapi import FastAPI, Depends, HTTPException, status, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from rag_pipeline import get_strategies, get_advice
import os
import urllib.parse
from models import create_db_and_tables, User
from sqlalchemy.orm import Session
from db import SessionLocal
import bcrypt
from jose import jwt
from datetime import datetime, timedelta
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

app = FastAPI()

create_db_and_tables()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "supersecretkey"  # Change this in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

# Load strategies from the correct CSV
STRATEGIES_FILE_PATH = os.path.join(os.path.dirname(__file__), 'data', 'strategies.csv')
strategies_df = pd.read_csv(STRATEGIES_FILE_PATH, sep=';')
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

security = HTTPBearer()

def get_current_user(request: Request, db: Session = Depends(get_db)):
    auth: HTTPAuthorizationCredentials = security(request)
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

@app.post("/api/v1/strategies")
async def strategies(intake_data: IntakeData):
    #Receives user intake data and returns the top 3 recommended strategies with full details.
  
    # 1. Get the list of recommended strategy metadata from the RAG pipeline
    recommended_metadata = get_strategies(intake_data.dict())
    
    # 2. Extract just the names of the strategies
    recommended_names = [meta['strategy_name'] for meta in recommended_metadata]
    
    # 3. Filter the main DataFrame to get the full details for those strategies
    full_recommendations = strategies_df[strategies_df['Strategie naam'].isin(recommended_names)]
    
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
def delete_account(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request, db)
    db.delete(user)
    db.commit()
    return {"detail": "Account deleted"}

@app.post('/api/v1/set_strategy')
def set_strategy(request: Request, db: Session = Depends(get_db), data: dict = Body(...)):
    user = get_current_user(request, db)
    strategy_name = data.get('strategy_name')
    if not strategy_name:
        raise HTTPException(status_code=400, detail='No strategy_name provided')
    user.current_strategy = strategy_name
    db.commit()
    return {"detail": "Strategy updated"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
