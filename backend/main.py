from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from rag_pipeline import generate_advice

app = FastAPI()

# CORS: Allow frontend at localhost:3000 to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define expected input format
class IntakeRequest(BaseModel):
    symptoms: List[str]
    preferences: List[str]
    cycle: str
    goals: List[str]

# Advice endpoint
@app.post("/advice")
def get_advice(input: IntakeRequest):
    return generate_advice(input.dict())
