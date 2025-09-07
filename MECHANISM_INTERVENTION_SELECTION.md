# Mechanism & Intervention Selection Process

## 🔄 **Complete Flow: From User Input to Personalized Workbook**

### **1. Strategy Retrieval (RAG Pipeline)**

#### **Step 1: User Input Processing**
```python
# User intake data from frontend
intake_data = {
    "symptoms": ["irregular periods", "weight gain", "mood swings"],
    "goals": ["balance hormones", "lose weight", "improve energy"],
    "cycle": "luteal",
    "dietaryRestrictions": ["gluten-free"],
    "whatWorks": "intermittent fasting",
    "extraThoughts": "struggling with PCOS"
}
```

#### **Step 2: Query Building**
```python
def get_strategies(user_input: dict) -> list:
    query = (
        f"Symptoms: {', '.join(symptoms)}. "
        + f"Goals: {', '.join(goals)}. "
        + f"Dietary restrictions: {', '.join(preferences)}. "
        + f"Cycle phase: {cycle}. "
        + f"What already works: {whatWorks}. "
        + f"Extra thoughts: {extraThoughts}. "
        + "Looking for strategies that match this profile."
    )
```

**Example Generated Query:**
```
"Symptoms: irregular periods, weight gain, mood swings. Goals: balance hormones, lose weight, improve energy. Dietary restrictions: gluten-free. Cycle phase: luteal. What already works: intermittent fasting. Extra thoughts: struggling with PCOS. Looking for strategies that match this profile."
```

#### **Step 3: Vector Search & Retrieval**
```python
# ChromaDB vector search
docs = strategy_retriever.invoke(query)  # Returns top 3 most similar strategies
strategies = [doc.metadata for doc in docs]
```

**Retrieved Strategies Example:**
```python
[
    {
        "strategy_name": "Intermittent Fasting for Hormone Balance",
        "explanation": "Eat within an 8-hour window to improve insulin sensitivity",
        "why": "Helps regulate blood sugar and reduce insulin resistance",
        "helps_with": "PCOS,Weight gain,Irregular cycles",
        "practical_tips": "Start with 12:12; Gradually reduce to 8:16; Stay hydrated",
        "sources": "Alisa Vitti - In the FLO"
    },
    {
        "strategy_name": "Seed Cycling for Hormone Balance",
        "explanation": "Eat specific seeds during different cycle phases",
        "why": "Provides nutrients that support natural hormone production",
        "helps_with": "Irregular cycles,Hormone balance,Mood swings",
        "practical_tips": "Flax seeds in follicular; Pumpkin seeds in luteal",
        "sources": "Alisa Vitti - In the FLO"
    }
]
```

---

## 🎯 **2. Mechanism Selection Process**

### **Step 1: Keyword-Based Detection**
```python
def generate_mechanisms_from_strategies(user_id: int, strategies: List[Dict], context: str) -> List[Dict]:
    # Predefined mechanism keywords
    mechanism_keywords = [
        "insulin resistance", "inflammation", "low progesterone", "estrogen dominance",
        "cortisol", "thyroid", "gut health", "blood sugar", "hormonal imbalance",
        "PCOS", "adrenal fatigue", "leptin resistance", "testosterone", "chronic stress",
        "HPA axis dysregulation", "HPO axis dysfunction", "Circadian rhythm disruption"
    ]
    
    for strategy in strategies:
        strategy_text = f"{strategy.get('Explanation', '')} {strategy.get('Why', '')}"
        
        # Check if strategy mentions any mechanisms
        for keyword in mechanism_keywords:
            if keyword.lower() in strategy_text.lower():
                # Create mechanism
```

### **Step 2: Mechanism Creation**
```python
mechanism = {
    "id": str(uuid.uuid4()),
    "user_id": user_id,
    "title": keyword.title(),  # "Insulin Resistance"
    "description": extract_mechanism_description(strategy_text, keyword),
    "confidence_score": calculate_confidence_score(strategy_text, keyword),
    "source": "rag",
    "created_at": datetime.utcnow().isoformat(),
    "updated_at": datetime.utcnow().isoformat()
}
```

### **Step 3: Confidence Scoring**
```python
def calculate_confidence_score(strategy_text: str, keyword: str) -> int:
    keyword_count = strategy_text.lower().count(keyword.lower())
    
    if keyword_count >= 3: return 90      # High confidence
    elif keyword_count >= 2: return 75    # Medium confidence  
    elif keyword_count >= 1: return 60    # Low confidence
    else: return 40                       # Very low confidence
```

### **Step 4: Deduplication & Ranking**
```python
# Remove duplicates and keep highest confidence
unique_mechanisms = {}
for mechanism in mechanisms:
    key = mechanism["title"].lower()
    if key not in unique_mechanisms or mechanism["confidence_score"] > unique_mechanisms[key]["confidence_score"]:
        unique_mechanisms[key] = mechanism

return list(unique_mechanisms.values())
```

**Example Generated Mechanisms:**
```python
[
    {
        "id": "uuid-1",
        "title": "Insulin Resistance",
        "description": "Helps regulate blood sugar and reduce insulin resistance. Related to insulin resistance based on your symptoms and goals.",
        "confidence_score": 90,
        "source": "rag"
    },
    {
        "id": "uuid-2", 
        "title": "Hormonal Imbalance",
        "description": "Provides nutrients that support natural hormone production. Related to hormonal imbalance based on your symptoms and goals.",
        "confidence_score": 75,
        "source": "rag"
    }
]
```

---

## 🔧 **3. Intervention Selection Process**

### **Step 1: Direct Strategy Mapping**
```python
def generate_interventions_from_strategies(user_id: int, strategies: List[Dict], context: str) -> List[Dict]:
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
            "source": "rag"
        }
        interventions.append(intervention)
```

### **Step 2: Mechanism-Intervention Linking**
```python
def find_related_mechanism(strategy: Dict, mechanisms: List[Dict]) -> str:
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
```

**Example Generated Interventions:**
```python
[
    {
        "id": "uuid-3",
        "mechanism_id": "uuid-1",  # Links to "Insulin Resistance"
        "title": "Intermittent Fasting for Hormone Balance",
        "description": "Eat within an 8-hour window to improve insulin sensitivity\n\nWhy: Helps regulate blood sugar and reduce insulin resistance\n\nPractical tips: Start with 12:12; Gradually reduce to 8:16; Stay hydrated",
        "confidence_score": 85,
        "source": "rag"
    },
    {
        "id": "uuid-4",
        "mechanism_id": "uuid-2",  # Links to "Hormonal Imbalance"
        "title": "Seed Cycling for Hormone Balance", 
        "description": "Eat specific seeds during different cycle phases\n\nWhy: Provides nutrients that support natural hormone production\n\nPractical tips: Flax seeds in follicular; Pumpkin seeds in luteal",
        "confidence_score": 85,
        "source": "rag"
    }
]
```

---

## 🔗 **4. Relationship Between Strategy Retrieval and Mechanism/Intervention Selection**

### **Direct Dependencies:**
1. **Strategy Retrieval** → **Mechanism Selection**
   - Strategies are the **source** for mechanism detection
   - Mechanism keywords are searched within strategy text
   - No mechanisms = No strategies mentioning them

2. **Strategy Retrieval** → **Intervention Selection**
   - **Every retrieved strategy becomes an intervention**
   - 1:1 mapping between strategies and interventions
   - Strategy metadata becomes intervention content

3. **Mechanism Selection** → **Intervention Linking**
   - Interventions are linked to mechanisms via keyword overlap
   - Mechanism must exist before intervention can be linked
   - Fallback: Creates default mechanism if none found

### **Selection Criteria:**

#### **Strategy Selection (RAG):**
- **Vector Similarity**: Cosine similarity with user query
- **Top-K Retrieval**: Returns top 3 most similar strategies
- **Query Relevance**: Based on symptoms, goals, cycle phase, etc.

#### **Mechanism Selection:**
- **Keyword Matching**: Predefined list of hormonal mechanisms
- **Text Analysis**: Searches strategy explanations for mechanism keywords
- **Confidence Scoring**: Based on keyword frequency in strategy text
- **Deduplication**: Removes duplicates, keeps highest confidence

#### **Intervention Selection:**
- **Direct Mapping**: Every strategy becomes an intervention
- **Content Enrichment**: Combines explanation, why, and practical tips
- **Mechanism Linking**: Links to most relevant mechanism via keyword overlap
- **Fixed Confidence**: 85% for all strategy-based interventions

---

## 📊 **5. Selection Quality & Limitations**

### **Current Strengths:**
- **Personalized**: Based on user's specific symptoms and goals
- **Contextual**: Considers cycle phase and dietary restrictions
- **Comprehensive**: Covers both mechanisms and interventions
- **Confidence-Based**: Ranks mechanisms by relevance

### **Current Limitations:**
- **Keyword-Only**: Mechanism detection relies on simple keyword matching
- **No ML**: No machine learning for mechanism detection
- **Fixed List**: Mechanism keywords are hardcoded
- **Simple Linking**: Intervention-mechanism linking is basic keyword overlap

### **Potential Improvements:**
- **NLP Enhancement**: Use more sophisticated text analysis
- **ML Models**: Train models to detect mechanisms
- **Dynamic Keywords**: Learn mechanism keywords from data
- **Better Linking**: Use semantic similarity for intervention-mechanism linking

---

## 🎯 **6. Example Complete Flow**

### **Input:**
```python
user_input = {
    "symptoms": ["irregular periods", "weight gain"],
    "goals": ["balance hormones"],
    "cycle": "luteal"
}
```

### **Step 1: Strategy Retrieval**
```
Query: "Symptoms: irregular periods, weight gain. Goals: balance hormones. Cycle phase: luteal. Looking for strategies that match this profile."

Retrieved Strategies:
1. "Intermittent Fasting for Hormone Balance"
2. "Seed Cycling for Hormone Balance" 
3. "Anti-Inflammatory Diet"
```

### **Step 2: Mechanism Detection**
```
Strategy 1 Text: "Eat within an 8-hour window to improve insulin sensitivity. Helps regulate blood sugar and reduce insulin resistance."
→ Keywords Found: "insulin resistance", "blood sugar"
→ Mechanisms Created: "Insulin Resistance" (confidence: 90)

Strategy 2 Text: "Eat specific seeds during different cycle phases. Provides nutrients that support natural hormone production."
→ Keywords Found: "hormone production"
→ Mechanisms Created: "Hormonal Imbalance" (confidence: 75)
```

### **Step 3: Intervention Creation**
```
Intervention 1: "Intermittent Fasting for Hormone Balance"
→ Linked to: "Insulin Resistance" mechanism
→ Confidence: 85

Intervention 2: "Seed Cycling for Hormone Balance"
→ Linked to: "Hormonal Imbalance" mechanism  
→ Confidence: 85
```

### **Final Output:**
```python
{
    "mechanisms": [
        {"title": "Insulin Resistance", "confidence_score": 90},
        {"title": "Hormonal Imbalance", "confidence_score": 75}
    ],
    "interventions": [
        {"title": "Intermittent Fasting", "mechanism_id": "insulin-resistance-id"},
        {"title": "Seed Cycling", "mechanism_id": "hormonal-imbalance-id"}
    ]
}
```

This process creates a personalized workbook where mechanisms are intelligently detected from retrieved strategies, and interventions are directly mapped from those strategies while being linked to the most relevant mechanisms.
