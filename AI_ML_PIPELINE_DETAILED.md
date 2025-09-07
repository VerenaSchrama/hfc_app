# AI/ML Pipeline - Detailed Technical Explanation

## 🧠 **Overview: Multi-Stage AI Pipeline**

The HerFoodCode AI/ML pipeline is a sophisticated **Retrieval-Augmented Generation (RAG)** system that transforms a health book into personalized, actionable advice. It consists of **4 main stages**:

1. **Data Ingestion & Processing**
2. **Vector Store Construction** 
3. **Real-time RAG Query Processing**
4. **Workbook Generation & Personalization**

---

## 📚 **Stage 1: Data Ingestion & Processing**

### **1.1 Book Processing Pipeline**
```python
# Data Flow
InFloBook.pdf → InFloBook.txt → Text Chunking → JSON Storage
```

**Process:**
1. **PDF Extraction**: `InFloBook.pdf` → `InFloBook.txt` (raw text)
2. **Text Chunking**: Book split into manageable chunks (~500-1000 characters)
3. **JSON Storage**: Chunks stored in `chunks_AlisaVita.json`

**Example Chunk Structure:**
```json
[
  "Dedication\n\"Those who flow as life flows know they need no other force.\"\nLAO TZU...",
  "Advantages\nPart 2. Getting Your Body in the FLO\n4. Never Diet Again...",
  "9. Making Motherhood Easier\n10. Dynamic, Wise, and Free..."
]
```

### **1.2 Strategy Extraction with LLM**
**File**: `extract_strategies.py`

**Process:**
```python
def extract_strategies_with_llm(text_chunk):
    system_prompt = """
    You are an expert in nutrition and hormonal health, specializing in distilling actionable advice from text.
    Your task is to identify ONE single, clear, actionable strategy from the provided text.
    
    The JSON object must have the following keys:
    - "strategy_name": A short, catchy name for the strategy
    - "explanation": What the user should do (1-2 sentences)
    - "why": The reason this strategy works (1-2 sentences)
    - "helps_with": Comma-separated list of symptoms/goals
    - "practical_tips": Semicolon-separated list of 2-3 concrete tips
    - "sources": Should be "Alisa Vitti - In the FLO"
    """
```

**LLM Configuration:**
- **Model**: `gpt-4-turbo`
- **Temperature**: `0.2` (low for consistency)
- **Response Format**: `json_object`
- **Filtering**: Only chunks >150 characters processed

**Output**: `strategies.csv` with structured strategy data

---

## 🗄️ **Stage 2: Vector Store Construction**

### **2.1 Embedding Generation**
**File**: `build_strategy_store.py`

**Process:**
```python
# Initialize OpenAI Embeddings
embedding_model = OpenAIEmbeddings(api_key=api_key)

# Create LangChain Documents
for _, row in df.iterrows():
    content = (
        f"Strategy '{row['Strategie naam']}' is designed to help with: {row['Verhelpt klachten bij']}. "
        f"Explanation: {row['Uitleg']}. "
        f"Why it works: {row['Waarom']}. "
        f"Practical tips: {row['Praktische tips']}."
    )
    metadata = {
        "strategy_name": row['Strategie naam'],
        "explanation": row['Uitleg'],
        "why": row['Waarom'],
        "helps_with": row['Verhelpt klachten bij'],
        "sources": row['Bron(nen)'],
        "practical_tips": row['Praktische tips']
    }
    documents.append(Document(page_content=content, metadata=metadata))
```

### **2.2 Vector Store Creation**
```python
# Create ChromaDB Vector Store
vectorstore = Chroma.from_documents(
    documents=documents,
    embedding=embedding_model,  # OpenAI text-embedding-ada-002
    collection_name="strategies",
    persist_directory=PERSIST_DIR,
)
```

**Vector Store Structure:**
- **Database**: ChromaDB (persistent storage)
- **Embeddings**: OpenAI `text-embedding-ada-002` (1536 dimensions)
- **Collections**: 
  - `strategies` - Strategy-specific content
  - `main` - General health content
- **Storage**: `data/vectorstore/strategies_chroma/`

---

## 🔍 **Stage 3: Real-time RAG Query Processing**

### **3.1 Query Processing Pipeline**
**File**: `rag_pipeline.py`

**Components:**
```python
# Initialize AI Components
llm = ChatOpenAI(model="gpt-4", temperature=0)
embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))

# Load Vector Stores
strategy_vectorstore = Chroma(
    persist_directory=STRATEGY_VECTORSTORE_PATH,
    embedding_function=embeddings,
    collection_name="strategies"
)
strategy_retriever = strategy_vectorstore.as_retriever(search_kwargs={"k": 3})
```

### **3.2 Query Building & Context Construction**
```python
def build_question(user_input: dict) -> str:
    """Build a comprehensive question from user intake data."""
    symptoms = ensure_list(user_input.get('symptoms'))
    goals = ensure_list(user_input.get('goals'))
    preferences = ensure_list(user_input.get('dietaryRestrictions'))
    cycle = user_input.get('cycle', '')
    reason = user_input.get('reason', '')
    whatWorks = user_input.get('whatWorks', '')
    extraThoughts = user_input.get('extraThoughts', '')

    question = (
        f"My symptoms are: {', '.join(symptoms)}. "
        + f"My goals are: {', '.join(goals)}. "
        + f"My dietary restrictions are: {', '.join(preferences)}. "
        + f"I'm currently in the {cycle} phase of my cycle. "
        + f"My reason for using this app: {reason}. "
        + f"What already works for me: {whatWorks}. "
        + f"Extra thoughts: {extraThoughts}. "
        + "What should I eat?"
    )
    return question
```

### **3.3 RAG Chain Implementation**
```python
# Conversational RAG Chain
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

qa_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=strategy_retriever,
    memory=memory,
    return_source_documents=True,
    verbose=False
)

# Simple RAG Chain
rag_chain = (
    {"context": main_retriever | format_docs, "question": RunnablePassthrough()}
    | rag_prompt
    | llm
    | StrOutputParser()
)
```

### **3.4 Strategy Retrieval Process**
```python
def get_strategies(user_input: dict) -> list:
    """Get strategy recommendations based on user input."""
    query = (
        f"Symptoms: {', '.join(symptoms)}. "
        + f"Goals: {', '.join(goals)}. "
        + f"Dietary restrictions: {', '.join(preferences)}. "
        + f"Cycle phase: {cycle}. "
        + "Looking for strategies that match this profile."
    )
    
    docs = strategy_retriever.invoke(query)
    strategies = [doc.metadata for doc in docs]
    return strategies
```

**Retrieval Process:**
1. **Query Embedding**: User input → OpenAI embedding vector
2. **Similarity Search**: Cosine similarity with stored vectors
3. **Top-K Retrieval**: Return top 3 most relevant strategies
4. **Metadata Extraction**: Extract strategy metadata for processing

---

## 🎯 **Stage 4: Workbook Generation & Personalization**

### **4.1 Mechanism Extraction**
**File**: `workbook_rag.py`

**Process:**
```python
def generate_mechanisms_from_strategies(user_id: int, strategies: List[Dict], context: str) -> List[Dict]:
    """Extract hormonal mechanisms from RAG strategies."""
    
    # Predefined mechanism keywords
    mechanism_keywords = [
        "insulin resistance", "inflammation", "low progesterone", 
        "estrogen dominance", "cortisol", "thyroid", "gut health",
        "blood sugar", "hormonal imbalance", "PCOS", "adrenal fatigue",
        "leptin resistance", "testosterone", "chronic stress",
        "HPA axis dysregulation", "HPO axis dysfunction"
    ]
    
    for strategy in strategies:
        strategy_text = f"{strategy.get('Explanation', '')} {strategy.get('Why', '')}"
        
        # Keyword matching for mechanism detection
        for keyword in mechanism_keywords:
            if keyword.lower() in strategy_text.lower():
                mechanism = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "title": keyword.title(),
                    "description": extract_mechanism_description(strategy_text, keyword),
                    "confidence_score": calculate_confidence_score(strategy_text, keyword),
                    "source": "rag"
                }
                mechanisms.append(mechanism)
```

### **4.2 Intervention Mapping**
```python
def generate_interventions_from_strategies(user_id: int, strategies: List[Dict], context: str) -> List[Dict]:
    """Map strategies to interventions linked to mechanisms."""
    
    for strategy in strategies:
        intervention = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "mechanism_id": find_related_mechanism(strategy, mechanisms),
            "title": strategy.get('Strategy name', 'Nutrition Strategy'),
            "description": f"{strategy.get('Explanation', '')}\n\nWhy: {strategy.get('Why', '')}",
            "is_tracking": False,
            "tracking_frequency": "daily",
            "confidence_score": 85,
            "source": "rag"
        }
        interventions.append(intervention)
```

### **4.3 Confidence Scoring Algorithm**
```python
def calculate_confidence_score(strategy_text: str, keyword: str) -> int:
    """Calculate confidence score for mechanism relevance."""
    
    keyword_count = strategy_text.lower().count(keyword.lower())
    text_length = len(strategy_text.split())
    
    # Scoring based on keyword frequency
    if keyword_count >= 3:
        return 90
    elif keyword_count >= 2:
        return 75
    elif keyword_count >= 1:
        return 60
    else:
        return 40
```

### **4.4 Mechanism-Intervention Linking**
```python
def find_related_mechanism(strategy: Dict, mechanisms: List[Dict]) -> str:
    """Find the most related mechanism for an intervention."""
    
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

---

## 🔄 **Complete Data Flow**

### **End-to-End Process:**
```
1. User Intake Data
   ↓
2. Query Building (build_question)
   ↓
3. Vector Search (ChromaDB + OpenAI Embeddings)
   ↓
4. Strategy Retrieval (Top-K Similarity)
   ↓
5. Mechanism Extraction (Keyword Matching)
   ↓
6. Intervention Mapping (Strategy → Mechanism)
   ↓
7. Confidence Scoring (Frequency-based)
   ↓
8. Database Storage (Supabase + SQLAlchemy)
   ↓
9. Personalized Workbook Generation
```

### **Real-time Chat Integration:**
```python
def generate_advice(user_input: dict) -> dict:
    """Generate contextual advice with conversation memory."""
    
    # Build question from user input
    question = build_question(user_input)
    
    # Create conversational chain with memory
    qa_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=strategy_retriever,
        memory=memory,
        return_source_documents=True
    )
    
    # Generate response
    result = qa_chain.invoke({"question": question})
    return {"answer": result["answer"]}
```

---

## 🎛️ **Configuration & Parameters**

### **AI Model Settings:**
- **LLM**: GPT-4 (temperature=0 for consistency)
- **Embeddings**: OpenAI text-embedding-ada-002
- **Vector Store**: ChromaDB with persistent storage
- **Retrieval**: Top-K=3 strategies per query

### **Performance Optimizations:**
- **Caching**: Persistent vector store storage
- **Batch Processing**: Strategy extraction in batches
- **Error Handling**: Graceful degradation if AI services fail
- **Memory Management**: Conversation buffer for context

### **Scalability Features:**
- **Modular Design**: Separate RAG and workbook systems
- **Database Flexibility**: Supabase + SQLite fallback
- **API-First**: Clean REST endpoints for frontend integration
- **Monitoring**: Health checks and error tracking

---

## 🧪 **Technical Implementation Details**

### **Vector Similarity Search:**
```python
# Cosine similarity calculation
similarities = cosine_similarity([query_embedding], strategy_embeddings)[0]
top_indices = similarities.argsort()[-top_k:][::-1]
```

### **Context Building:**
```python
def build_intake_context(intake_data: Dict[str, Any]) -> str:
    """Build context string from intake data for RAG queries."""
    context_parts = []
    
    if intake_data.get('symptoms'):
        context_parts.append(f"Symptoms: {', '.join(intake_data['symptoms'])}")
    if intake_data.get('goals'):
        context_parts.append(f"Goals: {', '.join(intake_data['goals'])}")
    # ... more context building
    
    return " | ".join(context_parts)
```

### **Database Integration:**
```python
def save_workbook_to_db(user_id: int, workbook_data: Dict[str, Any]) -> bool:
    """Save generated workbook data to database."""
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
```

This AI/ML pipeline transforms static book content into dynamic, personalized health advice through sophisticated RAG techniques, vector similarity search, and intelligent content mapping. The system is designed for scalability, reliability, and real-time performance.
