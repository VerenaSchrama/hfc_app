# HerFoodCode Backend Architecture Overview

## 🏗️ **System Architecture**

### **Core Technology Stack**
- **Framework**: FastAPI (Python 3.13)
- **Database**: Supabase (PostgreSQL) with SQLite fallback
- **Authentication**: JWT tokens with bcrypt password hashing
- **AI/ML**: OpenAI GPT-4 + LangChain + ChromaDB vector store
- **Deployment**: Render (production) with Docker support

---

## 📊 **Database Schema & Data Models**

### **Primary Tables (Supabase)**
1. **`users`** - User accounts and authentication
2. **`chat_messages`** - Conversation history
3. **`tracked_symptoms`** - User symptom tracking
4. **`daily_logs`** - Daily health logs and progress
5. **`trial_periods`** - Strategy trial tracking

### **Workbook Tables (SQLAlchemy)**
1. **`mechanisms`** - Hormonal mechanisms (insulin resistance, inflammation, etc.)
2. **`interventions`** - Specific interventions linked to mechanisms
3. **`daily_reflections`** - User daily reflections and notes
4. **`workbook_entries`** - General workbook content
5. **`archive_items`** - Archived content from uploads

---

## 🔄 **Data Flow & Generation Process**

### **1. User Intake → RAG Pipeline → Workbook Generation**

```
User Intake Data
    ↓
RAG Pipeline (rag_pipeline.py)
    ├── Vector Store Query (ChromaDB)
    ├── Strategy Retrieval
    └── LLM Processing (GPT-4)
    ↓
Workbook RAG (workbook_rag.py)
    ├── Mechanism Extraction
    ├── Intervention Generation
    └── Database Storage
    ↓
Personalized Workbook
```

### **2. RAG Pipeline Components**

#### **Vector Stores**
- **Main Vector Store**: `data/vectorstore/chroma/` - General health content
- **Strategy Vector Store**: `data/vectorstore/strategies_chroma/` - Strategy-specific content
- **Embeddings**: OpenAI text-embedding-ada-002

#### **Data Sources**
- **Book Content**: `InFloBook.pdf` → `InFloBook.txt` → `chunks_AlisaVita.json`
- **Strategy Database**: `strategies.csv` (extracted from book content)
- **Archive**: `strategies-archive.csv`

### **3. Workbook Generation Process**

#### **Mechanism Extraction**
```python
# From workbook_rag.py
mechanism_keywords = [
    "insulin resistance", "inflammation", "low progesterone", 
    "estrogen dominance", "cortisol", "thyroid", "gut health",
    "blood sugar", "hormonal imbalance", "PCOS", "adrenal fatigue"
]
```

#### **Intervention Mapping**
- Each strategy becomes an intervention
- Linked to relevant mechanisms via keyword matching
- Confidence scoring based on keyword frequency

---

## 🛠️ **API Endpoints Structure**

### **Authentication & User Management**
- `POST /api/v1/register` - User registration
- `POST /api/v1/login` - User authentication
- `GET /api/v1/profile` - User profile data

### **RAG & Strategy System**
- `POST /api/v1/strategies` - Get personalized strategies
- `GET /api/v1/strategies/{name}` - Get strategy details
- `POST /api/v1/advice` - General advice via RAG
- `POST /api/v1/chat` - Conversational chat with context

### **Tracking & Logging**
- `GET/POST /api/v1/symptoms` - Track symptoms
- `GET/POST /api/v1/logs/today` - Daily logs
- `GET /api/v1/logs` - Historical logs
- `POST /api/v1/trial_periods` - Strategy trials

### **Workbook System**
- `POST /api/v1/workbook/generate` - Generate initial workbook
- `GET /api/v1/workbook` - Retrieve user workbook
- `POST/PUT /api/v1/workbook/mechanisms` - CRUD mechanisms
- `POST/PUT /api/v1/workbook/interventions` - CRUD interventions
- `POST /api/v1/workbook/reflections` - Daily reflections
- `GET /api/v1/workbook/archive` - Archived content

---

## 🧠 **AI/ML Pipeline Details**

### **RAG Implementation**
```python
# Core RAG Chain
rag_chain = (
    {"context": main_retriever | format_docs, "question": RunnablePassthrough()}
    | rag_prompt
    | llm
    | StrOutputParser()
)
```

### **Strategy Extraction Process**
1. **Book Processing**: PDF → Text → Chunks → Embeddings
2. **LLM Extraction**: GPT-4 extracts strategies from chunks
3. **Vector Storage**: ChromaDB stores embeddings
4. **Retrieval**: Cosine similarity matching for user queries

### **Workbook Intelligence**
- **Mechanism Detection**: Keyword-based extraction from strategies
- **Intervention Mapping**: Automatic linking of strategies to mechanisms
- **Confidence Scoring**: Algorithmic scoring based on keyword frequency
- **Context Building**: User profile integration for personalized responses

---

## 🔐 **Security & Authentication**

### **JWT Implementation**
- **Algorithm**: HS256
- **Expiration**: 7 days
- **Secret**: Environment variable `SECRET_KEY`
- **Password Hashing**: bcrypt with salt

### **CORS Configuration**
- **Development**: `localhost:3000`, `127.0.0.1:3000`
- **Production**: Vercel domains with regex pattern matching
- **Methods**: All methods allowed
- **Headers**: All headers allowed

---

## 📁 **File Structure**

```
backend/
├── main.py                 # FastAPI application & endpoints
├── models.py              # SQLAlchemy database models
├── db.py                  # Database connection & Supabase client
├── rag_pipeline.py        # RAG implementation & LLM chains
├── workbook_rag.py        # Workbook generation logic
├── extract_strategies.py  # Strategy extraction from book
├── build_strategy_store.py # Vector store building
├── requirements.txt       # Python dependencies
├── Dockerfile            # Container configuration
└── data/
    ├── strategies.csv    # Strategy database
    ├── vectorstore/      # ChromaDB stores
    └── processed/        # Processed book content
```

---

## 🚀 **Deployment & Environment**

### **Environment Variables**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key
- `OPENAI_API_KEY` - OpenAI API key
- `SECRET_KEY` - JWT secret key

### **Database Strategy**
- **Primary**: Supabase (PostgreSQL) for production
- **Fallback**: SQLite for development
- **Auto-detection**: Tests connection on startup

### **Deployment**
- **Platform**: Render
- **Container**: Docker
- **Health Checks**: `/health` endpoint
- **Version**: 1.0.5 (auto-incremented for deployments)

---

## 🔄 **Data Processing Pipeline**

### **1. Initial Setup**
```python
# Book processing
PDF → Text → Chunks → LLM Extraction → CSV → Vector Store
```

### **2. User Interaction**
```python
# User query processing
Intake Data → RAG Query → Vector Search → LLM Response → Database Storage
```

### **3. Workbook Generation**
```python
# Personalized workbook creation
User Profile → Strategy Retrieval → Mechanism Extraction → Intervention Mapping → Database Storage
```

---

## 📈 **Performance & Scalability**

### **Caching Strategy**
- **Vector Store**: ChromaDB with persistent storage
- **Database**: Supabase with connection pooling
- **LLM**: OpenAI with rate limiting

### **Error Handling**
- **Graceful Degradation**: App continues if vector store fails
- **Fallback Responses**: Default messages when AI unavailable
- **Database Rollback**: Transaction safety for data integrity

### **Monitoring**
- **Health Endpoints**: `/health`, `/api/v1/test-db`
- **Error Logging**: Comprehensive error tracking
- **API Versioning**: Version tracking for deployments

---

## 🎯 **Key Features**

### **Intelligent Content Generation**
- **Personalized Strategies**: Based on user symptoms and goals
- **Mechanism Detection**: Automatic identification of hormonal issues
- **Intervention Mapping**: Smart linking of strategies to mechanisms
- **Context-Aware Chat**: Conversational AI with user history

### **Data Persistence**
- **User Progress**: Daily logs and symptom tracking
- **Workbook State**: Persistent mechanism and intervention data
- **Chat History**: Conversation memory for context
- **Archive System**: Long-term storage of user content

### **Flexibility**
- **Multi-Database**: Supabase + SQLite fallback
- **Modular Design**: Separate RAG and workbook systems
- **Extensible**: Easy to add new data sources and models
- **API-First**: Clean REST API for frontend integration

---

## 🔧 **Development & Maintenance**

### **Code Quality**
- **Type Hints**: Full Python type annotations
- **Error Handling**: Comprehensive exception management
- **Documentation**: Inline code documentation
- **Modularity**: Clear separation of concerns

### **Testing Strategy**
- **Health Checks**: Automated endpoint testing
- **Database Tests**: Connection and query validation
- **Error Scenarios**: Graceful failure handling
- **Integration**: End-to-end workflow testing

This backend provides a robust, scalable foundation for the HerFoodCode app with intelligent content generation, persistent data storage, and seamless user experience.
