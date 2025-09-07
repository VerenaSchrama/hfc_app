# Mechanism Selection Upgrade Plan: GPT + InFlo Book Vector Store

## 🎯 **Current State vs. Target State**

### **Current Mechanism Selection:**
- **Method**: Keyword matching against predefined list
- **Source**: Strategy text only
- **Limitations**: Hardcoded keywords, no context from book, basic matching

### **Target Mechanism Selection:**
- **Method**: GPT-4 with RAG from InFlo book vector store
- **Source**: Full book content + user context
- **Benefits**: Intelligent detection, contextual understanding, dynamic mechanisms

---

## 📋 **Step-by-Step Implementation Plan**

### **Step 1: Create New Mechanism Detection Function**

**File**: `backend/workbook_rag.py`

**New Function**: `generate_mechanisms_with_gpt()`

```python
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
    
    # Build comprehensive query for mechanism detection
    mechanism_query = build_mechanism_query(intake_data, context)
    
    # Retrieve relevant book content
    book_docs = main_retriever.invoke(mechanism_query)
    book_context = format_docs(book_docs)
    
    # Create GPT prompt for mechanism detection
    mechanism_prompt = create_mechanism_detection_prompt(intake_data, book_context)
    
    # Call GPT-4 for mechanism detection
    mechanisms = call_gpt_for_mechanisms(mechanism_prompt, user_id)
    
    return mechanisms
```

### **Step 2: Create Mechanism Query Builder**

```python
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
```

### **Step 3: Create GPT Mechanism Detection Prompt**

```python
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
Return a JSON array with this structure:
[
  {{
    "title": "Mechanism Name",
    "description": "Detailed explanation of the mechanism and its relevance",
    "confidence_score": 85,
    "relevant_symptoms": ["symptom1", "symptom2"],
    "source_evidence": "Specific quote or reference from the book content",
    "category": "Blood Sugar & Insulin Issues"
  }}
]

Focus on mechanisms that are:
1. Directly supported by the book content
2. Highly relevant to the user's specific symptoms
3. Actionable through lifestyle interventions
4. Scientifically sound and well-explained in the source material

Return only the JSON array, no additional text.
"""
    
    return prompt
```

### **Step 4: Create GPT API Call Function**

```python
def call_gpt_for_mechanisms(prompt: str, user_id: int) -> List[Dict]:
    """Call GPT-4 to detect mechanisms from book content."""
    
    try:
        from openai import OpenAI
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
        mechanisms_data = json.loads(response.choices[0].message.content)
        
        # Convert to standard format
        mechanisms = []
        for mechanism_data in mechanisms_data.get('mechanisms', []):
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
        # Fallback to empty list or basic mechanisms
        return []
```

### **Step 5: Update Main Workbook Generation Function**

```python
def generate_workbook_from_intake(user_id: int, intake_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate initial workbook content using RAG pipeline based on user intake data.
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
```

### **Step 6: Update Intervention Linking**

```python
def generate_interventions_from_strategies(user_id: int, strategies: List[Dict], context: str, mechanisms: List[Dict] = None) -> List[Dict]:
    """Generate interventions from RAG strategies, linking to GPT-detected mechanisms."""
    
    interventions = []
    
    # Use provided mechanisms or generate them
    if mechanisms is None:
        mechanisms = generate_mechanisms_with_gpt(user_id, context)
    
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
            "confidence_score": 85,
            "source": "rag",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        interventions.append(intervention)
    
    return interventions

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
```

---

## 🔧 **Implementation Steps**

### **Step 1: Add Required Imports**
```python
# Add to workbook_rag.py
import json
import os
from openai import OpenAI
```

### **Step 2: Update Vector Store Access**
```python
# Ensure main_retriever is accessible
from rag_pipeline import main_retriever
```

### **Step 3: Test the New Function**
```python
# Add test function
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
```

### **Step 4: Update Database Schema (Optional)**
```python
# Add new fields to Mechanism model in models.py
class Mechanism(Base):
    # ... existing fields ...
    relevant_symptoms = Column(JSON, nullable=True)  # Array of symptoms
    source_evidence = Column(String, nullable=True)   # Book evidence
    category = Column(String, nullable=True)          # Mechanism category
```

### **Step 5: Gradual Rollout**
```python
# Add feature flag for gradual rollout
USE_GPT_MECHANISMS = os.getenv("USE_GPT_MECHANISMS", "false").lower() == "true"

def generate_workbook_from_intake(user_id: int, intake_data: Dict[str, Any]) -> Dict[str, Any]:
    # ... existing code ...
    
    if USE_GPT_MECHANISMS:
        mechanisms = generate_mechanisms_with_gpt(user_id, intake_data, context)
    else:
        mechanisms = generate_mechanisms_from_strategies(user_id, strategies, context)
    
    # ... rest of function ...
```

---

## 🧪 **Testing & Validation**

### **Test Cases:**
1. **PCOS User**: Symptoms: irregular periods, weight gain, acne
2. **Thyroid Issues**: Symptoms: fatigue, weight gain, hair loss
3. **Stress-Related**: Symptoms: anxiety, sleep issues, irregular cycles
4. **Inflammation**: Symptoms: bloating, joint pain, skin issues

### **Validation Criteria:**
- Mechanisms are relevant to user symptoms
- Descriptions are accurate and helpful
- Confidence scores are reasonable
- Source evidence is from book content
- Categories are appropriate

### **Performance Monitoring:**
- GPT API response time
- Mechanism detection accuracy
- User satisfaction with mechanisms
- Cost per mechanism detection

---

## 📊 **Expected Benefits**

### **Improved Mechanism Detection:**
- **Contextual Understanding**: GPT understands user context better
- **Book Knowledge**: Leverages full InFlo book content
- **Dynamic Detection**: Not limited to predefined keywords
- **Better Descriptions**: More detailed and helpful explanations

### **Enhanced User Experience:**
- **More Relevant**: Mechanisms match user's specific situation
- **Better Explanations**: Clear descriptions of how mechanisms relate to symptoms
- **Source Evidence**: Users can see why each mechanism was suggested
- **Categorized**: Mechanisms organized by type for better understanding

### **Technical Advantages:**
- **Scalable**: Easy to add new mechanism types
- **Maintainable**: No hardcoded keyword lists
- **Flexible**: Can adapt to different user profiles
- **Extensible**: Can easily add new data sources

---

## 🚀 **Deployment Strategy**

### **Phase 1: Development & Testing**
- Implement new functions
- Add comprehensive tests
- Validate with sample data

### **Phase 2: Gradual Rollout**
- Deploy with feature flag
- Test with subset of users
- Monitor performance and accuracy

### **Phase 3: Full Deployment**
- Enable for all users
- Remove old keyword-based system
- Monitor and optimize

### **Phase 4: Enhancement**
- Add more sophisticated prompts
- Include additional data sources
- Implement feedback loops

This upgrade will transform the mechanism selection from a simple keyword-matching system to an intelligent, context-aware system that leverages the full knowledge of the InFlo book to provide users with highly relevant and well-explained mechanisms.
