# Confidence Scoring & Query Analysis

## 🎯 **Your Questions Answered**

### **1. How is the confidence score calculated?**

There are **TWO different confidence scoring systems** in the current setup:

#### **A. Old System (Keyword-Based) - `calculate_confidence_score()`**
```python
def calculate_confidence_score(strategy_text: str, keyword: str) -> int:
    keyword_count = strategy_text.lower().count(keyword.lower())
    
    if keyword_count >= 3: return 90      # High confidence
    elif keyword_count >= 2: return 75    # Medium confidence  
    elif keyword_count >= 1: return 60    # Low confidence
    else: return 40                       # Very low confidence
```

**Method**: Simple keyword frequency counting
- **3+ mentions**: 90% confidence
- **2 mentions**: 75% confidence
- **1 mention**: 60% confidence
- **0 mentions**: 40% confidence

#### **B. New System (GPT-Based) - `call_gpt_for_mechanisms()`**
```python
"confidence_score": mechanism_data.get("confidence_score", 70)
```

**Method**: GPT-4 determines confidence based on:
- Relevance to user's specific symptoms
- Strength of evidence in book content
- How well the mechanism matches the user profile
- **Default**: 70% if not specified by GPT

**GPT Prompt Instructions**:
```
"Confidence Score: 0-100 based on how well it matches their profile"
```

---

### **2. Purpose and Usage of Query Building - FIXED!**

**UPDATE**: The hardcoded "What should I eat?" issue has been **completely resolved**!

#### **A. NEW Dynamic Chat System - `generate_advice()`**
```python
def generate_advice(user_question: str, user_context: str = None) -> dict:
    """Generate advice using user's actual question and context."""
    if user_context:
        full_question = f"{user_context}\n\nUser Question: {user_question}"
    else:
        full_question = user_question
    
    # Use RAG chain with user's actual question
    result = qa_chain.invoke({"question": full_question})
    return {"answer": result["answer"]}
```

**Purpose**: Handles **dynamic user questions** in the chat interface
- **Usage**: Users ask real questions, get relevant responses
- **Dynamic**: "How can I improve my sleep?" → Sleep advice
- **Contextual**: User profile provides background information
- **Example**: User asks "What supplements should I take?" → Gets supplement recommendations

#### **B. LEGACY Fixed System - `build_question()` (DEPRECATED)**
```python
def build_question(user_input: dict) -> str:
    question = (
        f"My symptoms are: {', '.join(symptoms)}. "
        + f"My goals are: {', '.join(goals)}. "
        + f"I'm currently in the {cycle} phase of my cycle. "
        + "What should I eat?"  # ← FIXED HARDCODED QUESTION
    )
```

**Purpose**: OLD system that always ended with "What should I eat?"
- **Problem**: Every user got the same question regardless of what they wanted to know
- **Status**: DEPRECATED - replaced by dynamic system

#### **B. Strategy Retrieval Query - `get_strategies()`**
```python
def get_strategies(user_input: dict) -> list:
    query = (
        f"Symptoms: {', '.join(symptoms)}. "
        + f"Goals: {', '.join(goals)}. "
        + f"Cycle phase: {cycle}. "
        + "Looking for strategies that match this profile."  # ← This is for STRATEGY retrieval
    )
```

**Purpose**: Creates search queries for **strategy retrieval**
- **Usage**: Finds relevant strategies from the database
- **Ends with**: "Looking for strategies that match this profile"
- **Example**: "Symptoms: irregular periods, weight gain. Looking for strategies that match this profile."

#### **C. Mechanism Detection Query - `build_mechanism_query()`**
```python
def build_mechanism_query(intake_data: Dict[str, Any], context: str) -> str:
    query = (
        f"User symptoms: {symptoms}. "
        + f"User goals: {goals}. "
        + f"Cycle phase: {cycle}. "
        + "Looking for information about hormonal mechanisms..."  # ← This is for MECHANISM detection
    )
```

**Purpose**: Creates queries for **mechanism detection from book content**
- **Usage**: Searches InFlo book for relevant mechanism information
- **Ends with**: "Looking for information about hormonal mechanisms..."

---

### **3. How Generated Strategies are Used for Mechanisms AND Workbook Creation**

The strategies serve **multiple purposes** in the workbook generation process:

#### **A. Strategy Retrieval Process**
```python
# Step 1: Get strategies from vector store
strategies = get_strategies(intake_data)
```

**What happens**:
1. User intake data → Query building
2. Vector search in `strategies_chroma` database
3. Returns top 3 most relevant strategies
4. Each strategy contains: name, explanation, why, practical tips, etc.

#### **B. Mechanism Detection (NEW GPT Method)**
```python
# Step 2: Generate mechanisms using GPT + book content
mechanisms = generate_mechanisms_with_gpt(user_id, intake_data, context)
```

**What happens**:
1. **Independent of strategies** - uses book content directly
2. GPT analyzes user profile + book content
3. Identifies 3-5 relevant hormonal mechanisms
4. Each mechanism gets confidence score, description, evidence

#### **C. Intervention Creation (Strategy → Intervention Mapping)**
```python
# Step 3: Create interventions from strategies
interventions = generate_interventions_from_strategies(user_id, strategies, context, mechanisms)
```

**What happens**:
1. **Each strategy becomes an intervention**
2. Links interventions to GPT-detected mechanisms
3. Uses advanced linking algorithm for better matching

#### **D. Complete Workbook Structure**
```python
return {
    "mechanisms": mechanisms,      # ← GPT-detected from book content
    "interventions": interventions, # ← Strategies converted to interventions
    "context": context
}
```

---

## 🔄 **Complete Data Flow**

### **Step-by-Step Process**:

1. **User Intake** → **Multiple Query Types**
   - Chat query: "What should I eat?" (for conversations)
   - Strategy query: "Looking for strategies..." (for strategy retrieval)
   - Mechanism query: "Looking for mechanisms..." (for book search)

2. **Strategy Retrieval** (Uses strategy vector store)
   - Input: User symptoms, goals, cycle
   - Process: Vector similarity search
   - Output: Top 3 relevant strategies

3. **Mechanism Detection** (Uses book vector store + GPT)
   - Input: User profile + book content
   - Process: GPT analysis of book content
   - Output: 3-5 mechanisms with confidence scores

4. **Intervention Creation** (Uses strategies + mechanisms)
   - Input: Retrieved strategies + detected mechanisms
   - Process: Strategy → Intervention mapping + mechanism linking
   - Output: Interventions linked to relevant mechanisms

5. **Workbook Assembly**
   - Mechanisms: GPT-detected from book
   - Interventions: Strategy-based, linked to mechanisms
   - Result: Personalized workbook with both components

---

## 🎯 **Key Insights**

### **Why "What should I eat?" Was a Problem (NOW FIXED!)**
- **Fixed Question**: Every user got the same question regardless of what they wanted to know
- **Poor UX**: User asks about sleep → Gets food advice
- **Not Dynamic**: Limited to food-focused responses only
- **Solution**: Now users can ask any question and get relevant answers!

### **Why Strategies are Used for Interventions?**
- **Proven Content**: Strategies are already validated and structured
- **Practical**: Each strategy has clear explanations and tips
- **Comprehensive**: Covers the "what to do" aspect of the workbook

### **Why Mechanisms are GPT-Detected Separately?**
- **Intelligence**: GPT can understand complex relationships
- **Context**: Uses full book knowledge, not just strategy text
- **Personalization**: Tailored to user's specific situation
- **Evidence**: Provides source references from the book

### **Confidence Score Differences**:
- **Old System**: Simple keyword counting (60-90%)
- **New System**: GPT intelligence (0-100%, default 70%)
- **Purpose**: Both indicate how confident the system is in the recommendation

This dual approach gives you the best of both worlds: **intelligent mechanism detection** from the book content and **practical interventions** from the proven strategy database! 🎉
