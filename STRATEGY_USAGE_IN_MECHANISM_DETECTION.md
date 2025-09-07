# Strategy Usage in Mechanism Detection

## 🎯 **Your Question Answered**

You asked: "How are the retrieved strategies OR the strategy dictionary used in mechanism detection here?"

The answer is: **Strategies are used in TWO different ways** depending on which mechanism detection system is active.

## 📊 **Current System Architecture**

### **Two Mechanism Detection Approaches:**

1. **NEW GPT-Based System** (Primary) - Uses InFlo book vector store
2. **LEGACY Strategy-Based System** (Fallback) - Uses retrieved strategies

---

## 🔄 **Complete Data Flow**

```
User Intake Data
    ↓
1. Strategy Retrieval (get_strategies)
    ↓
2. Mechanism Detection (TWO PATHS)
    ├── NEW: GPT + Book Vector Store (Primary)
    └── LEGACY: Strategy Analysis (Fallback)
    ↓
3. Intervention Creation (Uses strategies + mechanisms)
    ↓
4. Workbook Assembly
```

---

## 🆕 **NEW GPT-Based System (Primary)**

### **How It Works:**
```python
def generate_workbook_from_intake(user_id: int, intake_data: Dict[str, Any]):
    # 1. Get strategies (for interventions later)
    strategies = get_strategies(intake_data)
    
    # 2. Generate mechanisms using GPT + book content (NOT strategies)
    mechanisms = generate_mechanisms_with_gpt(user_id, intake_data, context)
    
    # 3. Create interventions from strategies + link to mechanisms
    interventions = generate_interventions_from_strategies(user_id, strategies, context, mechanisms)
```

### **Strategy Usage in NEW System:**
- **Mechanism Detection**: ❌ **NOT USED** - Uses book content instead
- **Intervention Creation**: ✅ **USED** - Strategies become interventions
- **Mechanism Linking**: ✅ **USED** - Links interventions to GPT-detected mechanisms

### **Why Strategies Aren't Used for Mechanisms:**
- **Better Source**: Book content is more comprehensive than extracted strategies
- **More Accurate**: GPT can identify complex mechanisms from detailed book content
- **Context-Rich**: Book provides full context, not just strategy summaries

---

## 🔄 **LEGACY Strategy-Based System (Fallback)**

### **How It Works:**
```python
def generate_mechanisms_from_strategies(user_id: int, strategies: List[Dict], context: str):
    mechanism_keywords = [
        "insulin resistance", "inflammation", "low progesterone", 
        "estrogen dominance", "cortisol", "thyroid", "gut health", 
        "blood sugar", "hormonal imbalance", "PCOS", "adrenal fatigue", 
        "leptin resistance", "testosterone", "chronic stress"
    ]
    
    for strategy in strategies:
        strategy_text = f"{strategy.get('Explanation', '')} {strategy.get('Why', '')}"
        
        # Check if strategy mentions any mechanisms
        for keyword in mechanism_keywords:
            if keyword.lower() in strategy_text.lower():
                mechanism = {
                    "title": keyword.title(),
                    "description": extract_mechanism_description(strategy_text, keyword),
                    "confidence_score": calculate_confidence_score(strategy_text, keyword),
                    "source": "rag"
                }
                mechanisms.append(mechanism)
```

### **Strategy Usage in LEGACY System:**
- **Mechanism Detection**: ✅ **USED** - Keyword matching in strategy text
- **Intervention Creation**: ✅ **USED** - Strategies become interventions
- **Mechanism Linking**: ✅ **USED** - Direct mapping from strategy content

---

## 🔍 **Detailed Strategy Usage Analysis**

### **1. Strategy Retrieval Process**
```python
def get_strategies(user_input: dict) -> list:
    query = (
        f"Symptoms: {', '.join(symptoms)}. "
        + f"Goals: {', '.join(goals)}. "
        + f"Cycle phase: {cycle}. "
        + "Looking for strategies that match this profile."
    )
    
    docs = strategy_retriever.invoke(query)
    strategies = [doc.metadata for doc in docs]
    return strategies
```

**Purpose**: Find relevant strategies from the `strategies_chroma` vector store
**Input**: User intake data
**Output**: List of strategy dictionaries with metadata

### **2. Strategy Dictionary Structure**
```python
strategy = {
    "Strategie naam": "Eat protein with every meal",
    "Explanation": "Protein helps stabilize blood sugar...",
    "Why": "Prevents insulin spikes and crashes...",
    "Category": "Nutrition",
    "Difficulty": "Easy",
    "Time": "5 minutes"
}
```

### **3. Mechanism Detection Usage**

#### **NEW System (GPT-Based):**
```python
# Strategies are NOT used for mechanism detection
mechanisms = generate_mechanisms_with_gpt(user_id, intake_data, context)
# Uses: InFlo book content + GPT-4 analysis
```

#### **LEGACY System (Strategy-Based):**
```python
# Strategies ARE used for mechanism detection
mechanisms = generate_mechanisms_from_strategies(user_id, strategies, context)
# Uses: Keyword matching in strategy text
```

### **4. Intervention Creation Usage (Both Systems)**
```python
def generate_interventions_from_strategies(user_id: int, strategies: List[Dict], context: str, mechanisms: List[Dict]):
    for strategy in strategies:
        intervention = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": strategy.get('Strategie naam', ''),
            "description": strategy.get('Explanation', ''),
            "why": strategy.get('Why', ''),
            "category": strategy.get('Category', ''),
            "difficulty": strategy.get('Difficulty', ''),
            "time_required": strategy.get('Time', ''),
            "mechanism_id": find_related_mechanism_advanced(strategy, mechanisms),
            "source": "rag"
        }
        interventions.append(intervention)
```

**Purpose**: Convert strategies into interventions
**Mechanism Linking**: Uses `find_related_mechanism_advanced()` to link interventions to mechanisms

---

## 📈 **Strategy Usage Summary**

| System | Mechanism Detection | Intervention Creation | Mechanism Linking |
|--------|-------------------|---------------------|------------------|
| **NEW (GPT)** | ❌ Not used | ✅ Used | ✅ Used |
| **LEGACY** | ✅ Used | ✅ Used | ✅ Used |

### **Key Insights:**

1. **Strategies are ALWAYS retrieved** - Both systems get strategies from the vector store
2. **Strategies are ALWAYS used for interventions** - They become the actionable items
3. **Mechanism detection differs**:
   - **NEW**: Uses book content + GPT (more accurate)
   - **LEGACY**: Uses strategy text + keywords (fallback)
4. **Mechanism linking is ALWAYS used** - Connects interventions to detected mechanisms

### **Why This Design?**

- **Best of Both Worlds**: GPT accuracy for mechanisms + proven strategies for interventions
- **Fallback Safety**: If GPT fails, keyword-based detection still works
- **Comprehensive**: Book content provides rich context for mechanism detection
- **Practical**: Strategies provide concrete, actionable interventions

The system is designed to be **robust** and **comprehensive** - using the best available data for each purpose! 🎯
