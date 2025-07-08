# python main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from .rag_pipeline import get_strategies, get_advice
import os
import urllib.parse

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load strategies from the correct CSV
STRATEGIES_FILE_PATH = os.path.join(os.path.dirname(__file__), 'data', 'strategies.csv')
strategies_df = pd.read_csv(STRATEGIES_FILE_PATH, sep=';')
strategies_df.fillna('', inplace=True)


# Define the correct and complete data model
class IntakeData(BaseModel):
    cycle: Optional[str] = None
    symptoms: Optional[List[str]] = None
    preferences: Optional[List[str]] = None
    goals: Optional[List[str]] = None


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
