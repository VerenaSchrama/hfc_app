# Query System Fix: Dynamic User Questions

## 🚨 **Current Problem**

The `build_question()` function is hardcoded to always end with "What should I eat?" regardless of what the user actually asks.

## 🔧 **Solution: Separate Intake Processing from User Questions**

### **Current Flawed Flow:**
```
User Intake Data → build_question() → "What should I eat?" (FIXED)
```

### **Proposed Fixed Flow:**
```
User Intake Data → build_context() → User's Actual Question → Dynamic Response
```

## 📋 **Implementation Plan**

### **Step 1: Create Context Builder (Not Question Builder)**

```python
def build_user_context(user_input: dict) -> str:
    """Build context string from user intake data for RAG queries."""
    symptoms = ensure_list(user_input.get('symptoms'))
    symptoms_note = user_input.get('symptoms_note', '')
    goals = ensure_list(user_input.get('goals'))
    goals_note = user_input.get('goals_note', '')
    preferences = ensure_list(user_input.get('dietaryRestrictions')) or ensure_list(user_input.get('preferences'))
    dietary_note = user_input.get('dietaryRestrictions_note', '')
    cycle = user_input.get('cycle', '')
    reason = user_input.get('reason', '')
    whatWorks = user_input.get('whatWorks', '')
    extraThoughts = user_input.get('extraThoughts', '')

    context = (
        f"User Profile:\n"
        f"- Symptoms: {', '.join(symptoms)}\n"
        + (f"- Symptom notes: {symptoms_note}\n" if symptoms_note else "")
        + f"- Goals: {', '.join(goals)}\n"
        + (f"- Goals notes: {goals_note}\n" if goals_note else "")
        + f"- Dietary restrictions: {', '.join(preferences)}\n"
        + (f"- Dietary notes: {dietary_note}\n" if dietary_note else "")
        + f"- Cycle phase: {cycle}\n"
        + (f"- Reason for using app: {reason}\n" if reason else "")
        + (f"- What already works: {whatWorks}\n" if whatWorks else "")
        + (f"- Additional thoughts: {extraThoughts}\n" if extraThoughts else "")
    )
    
    return context
```

### **Step 2: Update Chat Interface to Accept Real Questions**

```python
def generate_advice(user_question: str, user_context: str) -> dict:
    """Generate advice using the chatbot approach with user's actual question."""
    if not strategy_retriever:
        return {"answer": "I'm sorry, but I'm having trouble accessing my knowledge base right now. Please try again later."}
    
    # Combine user's actual question with their context
    full_question = f"{user_context}\n\nUser Question: {user_question}"
    
    # Create a conversational chain with memory
    from langchain.chains import ConversationalRetrievalChain
    from langchain.memory import ConversationBufferMemory
    
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True
    )
    
    # Create the chain
    qa_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=strategy_retriever,
        memory=memory,
        return_source_documents=True,
        verbose=False
    )
    
    try:
        # Invoke the chain with the user's actual question
        result = qa_chain.invoke({"question": full_question})
        return {"answer": result["answer"]}
    except Exception as e:
        return {"answer": "I'm sorry, but I encountered an error while processing your request. Please try again."}
```

### **Step 3: Update API Endpoints**

```python
# OLD: Fixed question
@app.post("/api/v1/advice")
async def advice(intake_data: IntakeData):
    response = get_advice(intake_data.dict())
    return response

# NEW: Dynamic question + context
@app.post("/api/v1/advice")
async def advice(request: ChatRequest):
    # Get user context from their profile
    user_context = build_user_context(get_user_profile())
    
    # Use their actual question
    response = generate_advice(request.question, user_context)
    return response

class ChatRequest(BaseModel):
    question: str  # User's actual question
```

### **Step 4: Frontend Integration**

```typescript
// Frontend sends actual user question
const askQuestion = async (question: string) => {
  const response = await fetch('/api/v1/advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  return response.json();
};

// Examples of dynamic questions:
// "What should I eat for breakfast during my luteal phase?"
// "How can I improve my sleep quality?"
// "What supplements should I take for PCOS?"
// "How does exercise affect my hormones?"
```

## 🎯 **Benefits of This Fix**

### **Dynamic Responses:**
- **User asks about food** → Gets food advice
- **User asks about sleep** → Gets sleep advice  
- **User asks about supplements** → Gets supplement advice
- **User asks about exercise** → Gets exercise advice

### **Better Context:**
- User profile provides background context
- User question drives the specific response
- More personalized and relevant answers

### **Improved UX:**
- Users get answers to their actual questions
- More natural conversation flow
- Better engagement and satisfaction

## 🔄 **Updated Data Flow**

### **Before (Flawed):**
```
User Intake → "What should I eat?" → Generic food advice
```

### **After (Fixed):**
```
User Intake → User Context
User Question → Specific Response
```

### **Example Scenarios:**

#### **Scenario 1: Food Question**
- **User asks**: "What should I eat for breakfast during my luteal phase?"
- **Context**: User has PCOS, irregular periods, weight gain
- **Response**: Specific luteal phase breakfast recommendations for PCOS

#### **Scenario 2: Sleep Question**
- **User asks**: "How can I improve my sleep quality?"
- **Context**: User has anxiety, irregular cycles, high stress
- **Response**: Sleep hygiene tips for hormonal balance

#### **Scenario 3: Supplement Question**
- **User asks**: "What supplements should I take for PCOS?"
- **Context**: User has insulin resistance, acne, irregular periods
- **Response**: Specific supplement recommendations for PCOS management

## 📝 **Implementation Steps**

1. **Create `build_user_context()`** - Extract context from intake data
2. **Update `generate_advice()`** - Accept real user questions
3. **Modify API endpoints** - Handle dynamic questions
4. **Update frontend** - Send actual user questions
5. **Test scenarios** - Verify different question types work

This fix will make the chat system truly dynamic and responsive to user needs! 🎉
