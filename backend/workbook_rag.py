"""
Workbook RAG Integration
Uses existing RAG pipeline to populate initial workbook with mechanisms and interventions
based on user intake data and vector store.
"""

import pandas as pd
from typing import List, Dict, Any, Tuple
from rag_pipeline import get_strategies, get_advice
import uuid
from datetime import datetime
from models import Mechanism, Intervention, DailyReflection, WorkbookEntry
from db import SessionLocal
import json

def generate_workbook_from_intake(user_id: int, intake_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate initial workbook content using RAG pipeline based on user intake data.
    
    Args:
        user_id: User ID
        intake_data: User intake data from frontend
    
    Returns:
        Dictionary containing generated mechanisms and interventions
    """
    
    # Build context from intake data
    context = build_intake_context(intake_data)
    
    # Use RAG pipeline to get relevant strategies
    strategies = get_strategies(intake_data)
    
    # Generate mechanisms and interventions from strategies
    mechanisms = generate_mechanisms_from_strategies(user_id, strategies, context)
    interventions = generate_interventions_from_strategies(user_id, strategies, context)
    
    return {
        "mechanisms": mechanisms,
        "interventions": interventions,
        "context": context
    }

def build_intake_context(intake_data: Dict[str, Any]) -> str:
    """Build context string from intake data for RAG queries."""
    
    context_parts = []
    
    if intake_data.get('symptoms'):
        context_parts.append(f"Symptoms: {', '.join(intake_data['symptoms'])}")
    
    if intake_data.get('goals'):
        context_parts.append(f"Goals: {', '.join(intake_data['goals'])}")
    
    if intake_data.get('cycle'):
        context_parts.append(f"Cycle phase: {intake_data['cycle']}")
    
    if intake_data.get('dietaryRestrictions'):
        context_parts.append(f"Dietary restrictions: {', '.join(intake_data['dietaryRestrictions'])}")
    
    if intake_data.get('whatWorks'):
        context_parts.append(f"What works: {intake_data['whatWorks']}")
    
    if intake_data.get('extraThoughts'):
        context_parts.append(f"Additional thoughts: {intake_data['extraThoughts']}")
    
    return " | ".join(context_parts)

def generate_mechanisms_from_strategies(user_id: int, strategies: List[Dict], context: str) -> List[Dict]:
    """Generate mechanisms from RAG strategies."""
    
    mechanisms = []
    
    # Common hormonal mechanisms to look for
    mechanism_keywords = [
        "insulin resistance", "inflammation", "low progesterone", "estrogen dominance",
        "cortisol", "thyroid", "gut health", "blood sugar", "hormonal imbalance",
        "PCOS", "adrenal fatigue", "leptin resistance", "testosterone", "chronic stress", "chronic inflammation", "HPA axis dysregulation","HPO axis dysfunction", "Circadian rhythm disruption", "Appetite hormone imbalance (ghrelin, leptin)"
    ]
    
    for strategy in strategies:
        strategy_text = f"{strategy.get('Explanation', '')} {strategy.get('Why', '')}"
        
        # Check if strategy mentions any mechanisms
        for keyword in mechanism_keywords:
            if keyword.lower() in strategy_text.lower():
                mechanism = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "title": keyword.title(),
                    "description": extract_mechanism_description(strategy_text, keyword),
                    "confidence_score": calculate_confidence_score(strategy_text, keyword),
                    "source": "rag",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                mechanisms.append(mechanism)
    
    # Remove duplicates and sort by confidence
    unique_mechanisms = {}
    for mechanism in mechanisms:
        key = mechanism["title"].lower()
        if key not in unique_mechanisms or mechanism["confidence_score"] > unique_mechanisms[key]["confidence_score"]:
            unique_mechanisms[key] = mechanism
    
    return list(unique_mechanisms.values())

def generate_interventions_from_strategies(user_id: int, strategies: List[Dict], context: str) -> List[Dict]:
    """Generate interventions from RAG strategies."""
    
    interventions = []
    mechanisms = generate_mechanisms_from_strategies(user_id, strategies, context)
    
    for strategy in strategies:
        # Create intervention for each strategy
        intervention = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "mechanism_id": find_related_mechanism(strategy, mechanisms),
            "title": strategy.get('Strategy name', 'Nutrition Strategy'),
            "description": f"{strategy.get('Explanation', '')}\n\nWhy: {strategy.get('Why', '')}\n\nPractical tips: {strategy.get('Practical tips', '')}",
            "is_tracking": False,
            "tracking_frequency": "daily",
            "confidence_score": 85,  # High confidence for direct strategy matches
            "source": "rag",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        interventions.append(intervention)
    
    return interventions

def extract_mechanism_description(strategy_text: str, keyword: str) -> str:
    """Extract description for a mechanism from strategy text."""
    
    # Simple extraction - in production, you might use more sophisticated NLP
    sentences = strategy_text.split('.')
    relevant_sentences = [s.strip() for s in sentences if keyword.lower() in s.lower()]
    
    if relevant_sentences:
        return '. '.join(relevant_sentences[:2]) + '.'
    else:
        return f"Related to {keyword} based on your symptoms and goals."

def calculate_confidence_score(strategy_text: str, keyword: str) -> int:
    """Calculate confidence score for mechanism relevance."""
    
    keyword_count = strategy_text.lower().count(keyword.lower())
    text_length = len(strategy_text.split())
    
    # Simple scoring based on keyword frequency and text length
    if keyword_count >= 3:
        return 90
    elif keyword_count >= 2:
        return 75
    elif keyword_count >= 1:
        return 60
    else:
        return 40

def find_related_mechanism(strategy: Dict, mechanisms: List[Dict]) -> str:
    """Find the most related mechanism for an intervention."""
    
    if not mechanisms:
        return str(uuid.uuid4())  # Create a default mechanism if none found
    
    strategy_text = f"{strategy.get('Explanation', '')} {strategy.get('Why', '')}".lower()
    
    # Find mechanism with highest keyword overlap
    best_mechanism = mechanisms[0]
    best_score = 0
    
    for mechanism in mechanisms:
        keyword = mechanism["title"].lower()
        score = strategy_text.count(keyword)
        if score > best_score:
            best_score = score
            best_mechanism = mechanism
    
    return best_mechanism["id"]

def save_workbook_to_db(user_id: int, workbook_data: Dict[str, Any]) -> bool:
    """Save generated workbook data to database."""
    
    try:
        db = SessionLocal()
        
        # Save mechanisms
        for mechanism_data in workbook_data["mechanisms"]:
            mechanism = Mechanism(**mechanism_data)
            db.add(mechanism)
        
        # Save interventions
        for intervention_data in workbook_data["interventions"]:
            intervention = Intervention(**intervention_data)
            db.add(intervention)
        
        db.commit()
        db.close()
        return True
        
    except Exception as e:
        print(f"Error saving workbook to database: {e}")
        db.rollback()
        db.close()
        return False

def get_user_workbook(user_id: int) -> Dict[str, Any]:
    """Retrieve user's workbook data from database."""
    
    try:
        db = SessionLocal()
        
        mechanisms = db.query(Mechanism).filter(Mechanism.user_id == user_id).all()
        interventions = db.query(Intervention).filter(Intervention.user_id == user_id).all()
        reflections = db.query(DailyReflection).filter(DailyReflection.user_id == user_id).all()
        
        db.close()
        
        return {
            "mechanisms": [mechanism.to_dict() for mechanism in mechanisms],
            "interventions": [intervention.to_dict() for intervention in interventions],
            "reflections": [reflection.to_dict() for reflection in reflections],
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"Error retrieving workbook: {e}")
        return {"mechanisms": [], "interventions": [], "reflections": [], "last_updated": datetime.utcnow().isoformat()}
