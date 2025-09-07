"""
Workbook RAG Integration
Uses existing RAG pipeline to populate initial workbook with mechanisms and interventions
based on user intake data and vector store.
"""

import pandas as pd
from typing import List, Dict, Any, Tuple
from rag_pipeline import get_strategies, get_advice, main_retriever, format_docs
import uuid
from datetime import datetime
from models import Mechanism, Intervention, DailyReflection, WorkbookEntry
from db import SessionLocal
import json
import os
from openai import OpenAI

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
    
    # NEW: Generate mechanisms using GPT + book vector store
    mechanisms = generate_mechanisms_with_gpt(user_id, intake_data, context)
    
    # Generate interventions from strategies (link to new mechanisms)
    interventions = generate_interventions_from_strategies(user_id, strategies, context, mechanisms)
    
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

def generate_interventions_from_strategies(user_id: int, strategies: List[Dict], context: str, mechanisms: List[Dict] = None) -> List[Dict]:
    """Generate interventions from RAG strategies, linking to GPT-detected mechanisms."""
    
    interventions = []
    
    # Use provided mechanisms or generate them (fallback to old method)
    if mechanisms is None:
        mechanisms = generate_mechanisms_from_strategies(user_id, strategies, context)
    
    for strategy in strategies:
        # Create intervention for each strategy
        intervention = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "mechanism_id": find_related_mechanism_advanced(strategy, mechanisms),
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

# ===== NEW GPT-BASED MECHANISM DETECTION =====

def generate_mechanisms_with_gpt(user_id: int, intake_data: Dict[str, Any], context: str) -> List[Dict]:
    """
    Generate mechanisms using GPT-4 with InFlo book vector store.
    
    Args:
        user_id: User ID
        intake_data: User intake data
        context: Built context string
    
    Returns:
        List of mechanism dictionaries
    """
    
    try:
        # Build comprehensive query for mechanism detection
        mechanism_query = build_mechanism_query(intake_data, context)
        
        # Retrieve relevant book content
        if main_retriever is None:
            print("Warning: main_retriever is None, falling back to keyword-based detection")
            return generate_mechanisms_from_strategies(user_id, [], context)
        
        book_docs = main_retriever.invoke(mechanism_query)
        book_context = format_docs(book_docs)
        
        # Create GPT prompt for mechanism detection
        mechanism_prompt = create_mechanism_detection_prompt(intake_data, book_context)
        
        # Call GPT-4 for mechanism detection
        mechanisms = call_gpt_for_mechanisms(mechanism_prompt, user_id)
        
        return mechanisms
        
    except Exception as e:
        print(f"Error in GPT mechanism detection: {e}")
        # Fallback to keyword-based detection
        return generate_mechanisms_from_strategies(user_id, [], context)

def build_mechanism_query(intake_data: Dict[str, Any], context: str) -> str:
    """Build query for retrieving relevant book content for mechanism detection."""
    
    symptoms = ', '.join(intake_data.get('symptoms', []))
    goals = ', '.join(intake_data.get('goals', []))
    cycle = intake_data.get('cycle', '')
    
    query = (
        f"User symptoms: {symptoms}. "
        f"User goals: {goals}. "
        f"Cycle phase: {cycle}. "
        f"Looking for information about hormonal mechanisms, underlying causes, "
        f"and root issues that could be causing these symptoms. "
        f"Focus on insulin resistance, inflammation, hormone imbalances, "
        f"PCOS, thyroid issues, gut health, stress, and other hormonal mechanisms."
    )
    
    return query

def create_mechanism_detection_prompt(intake_data: Dict[str, Any], book_context: str) -> str:
    """Create comprehensive prompt for GPT to detect mechanisms."""
    
    symptoms = ', '.join(intake_data.get('symptoms', []))
    goals = ', '.join(intake_data.get('goals', []))
    cycle = intake_data.get('cycle', '')
    
    prompt = f"""
You are an expert in women's hormonal health and nutrition. Based on the user's symptoms, goals, and the provided book content from "In the FLO" by Alisa Vitti, identify the most relevant hormonal mechanisms that could be causing their issues.

USER PROFILE:
- Symptoms: {symptoms}
- Goals: {goals}
- Cycle Phase: {cycle}
- Additional Context: {intake_data.get('extraThoughts', '')}

BOOK CONTEXT:
{book_context}

TASK:
Identify 3-5 key hormonal mechanisms that are most relevant to this user's profile. For each mechanism, provide:

1. **Mechanism Name**: Clear, specific name (e.g., "Insulin Resistance", "Chronic Inflammation")
2. **Description**: 2-3 sentences explaining what this mechanism is and how it relates to their symptoms
3. **Confidence Score**: 0-100 based on how well it matches their profile
4. **Relevant Symptoms**: Which of their symptoms this mechanism could be causing
5. **Source Evidence**: Specific references from the book content that support this mechanism

MECHANISM CATEGORIES TO CONSIDER:
- Blood Sugar & Insulin Issues (insulin resistance, blood sugar dysregulation)
- Inflammation (chronic inflammation, gut inflammation)
- Hormone Imbalances (estrogen dominance, low progesterone, cortisol issues)
- PCOS & Androgen Issues (elevated testosterone, PCOS mechanisms)
- Thyroid Function (hypothyroidism, thyroid hormone resistance)
- Gut Health (leaky gut, microbiome imbalance, digestive issues)
- Stress & HPA Axis (adrenal fatigue, cortisol dysregulation)
- Nutrient Deficiencies (vitamin D, zinc, magnesium, B vitamins)
- Circadian Rhythm (sleep-wake cycle disruption)
- Liver Function (hormone detoxification, liver congestion)

RESPONSE FORMAT:
Return a JSON object with this structure:
{{
  "mechanisms": [
    {{
      "title": "Mechanism Name",
      "description": "Detailed explanation of the mechanism and its relevance",
      "confidence_score": 85,
      "relevant_symptoms": ["symptom1", "symptom2"],
      "source_evidence": "Specific quote or reference from the book content",
      "category": "Blood Sugar & Insulin Issues"
    }}
  ]
}}

Focus on mechanisms that are:
1. Directly supported by the book content
2. Highly relevant to the user's specific symptoms
3. Actionable through lifestyle interventions
4. Scientifically sound and well-explained in the source material

Return only the JSON object, no additional text.
"""
    
    return prompt

def call_gpt_for_mechanisms(prompt: str, user_id: int) -> List[Dict]:
    """Call GPT-4 to detect mechanisms from book content."""
    
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert in women's hormonal health. Analyze the provided information and return only valid JSON."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3,  # Lower temperature for more consistent results
            max_tokens=2000
        )
        
        # Parse JSON response
        response_data = json.loads(response.choices[0].message.content)
        mechanisms_data = response_data.get('mechanisms', [])
        
        # Convert to standard format
        mechanisms = []
        for mechanism_data in mechanisms_data:
            mechanism = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": mechanism_data.get("title", ""),
                "description": mechanism_data.get("description", ""),
                "confidence_score": mechanism_data.get("confidence_score", 70),
                "relevant_symptoms": mechanism_data.get("relevant_symptoms", []),
                "source_evidence": mechanism_data.get("source_evidence", ""),
                "category": mechanism_data.get("category", ""),
                "source": "gpt_rag",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            mechanisms.append(mechanism)
        
        return mechanisms
        
    except Exception as e:
        print(f"Error calling GPT for mechanisms: {e}")
        # Fallback to empty list
        return []

def find_related_mechanism_advanced(strategy: Dict, mechanisms: List[Dict]) -> str:
    """Advanced mechanism linking using semantic similarity."""
    
    if not mechanisms:
        return str(uuid.uuid4())
    
    strategy_text = f"{strategy.get('Explanation', '')} {strategy.get('Why', '')}".lower()
    strategy_symptoms = strategy.get('helps_with', '').lower()
    
    best_mechanism = mechanisms[0]
    best_score = 0
    
    for mechanism in mechanisms:
        # Calculate similarity based on multiple factors
        title_match = strategy_text.count(mechanism["title"].lower())
        category_match = strategy_text.count(mechanism.get("category", "").lower())
        symptom_match = sum(1 for symptom in mechanism.get("relevant_symptoms", []) 
                           if symptom.lower() in strategy_symptoms)
        
        # Weighted scoring
        score = (title_match * 3) + (category_match * 2) + (symptom_match * 1)
        
        if score > best_score:
            best_score = score
            best_mechanism = mechanism
    
    return best_mechanism["id"]

def test_mechanism_detection():
    """Test the new GPT-based mechanism detection."""
    
    test_intake = {
        "symptoms": ["irregular periods", "weight gain", "mood swings"],
        "goals": ["balance hormones", "lose weight"],
        "cycle": "luteal",
        "extraThoughts": "struggling with PCOS"
    }
    
    mechanisms = generate_mechanisms_with_gpt(1, test_intake, "test context")
    print(f"Detected {len(mechanisms)} mechanisms:")
    for mechanism in mechanisms:
        print(f"- {mechanism['title']} (confidence: {mechanism['confidence_score']})")
        print(f"  Description: {mechanism['description']}")
        print(f"  Category: {mechanism['category']}")
        print(f"  Relevant symptoms: {mechanism['relevant_symptoms']}")
        print()
    
    return mechanisms
