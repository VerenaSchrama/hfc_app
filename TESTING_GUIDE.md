# Testing Guide: Mechanism-First Architecture

## 🧪 **Testing Options**

### **1. Local Backend Testing (Recommended)**

#### **Option A: Python Test Script**
```bash
cd backend
python test_mechanism_first.py
```

#### **Option B: Interactive Python Testing**
```bash
cd backend
python3 -c "
from workbook_rag import generate_workbook_from_intake
import json

# Test data
intake_data = {
    'symptoms': ['irregular periods', 'weight gain', 'acne'],
    'goals': ['regulate cycle', 'lose weight', 'clear skin'],
    'cycle': 'follicular',
    'dietaryRestrictions': ['gluten-free'],
    'extraThoughts': 'I have PCOS and want to manage it naturally'
}

# Generate workbook
workbook = generate_workbook_from_intake(999, intake_data)
print(json.dumps(workbook, indent=2))
"
```

### **2. API Endpoint Testing**

#### **Option A: Using curl**
```bash
curl -X POST "http://localhost:8000/api/v1/generate-workbook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "symptoms": ["irregular periods", "weight gain", "acne"],
    "goals": ["regulate cycle", "lose weight", "clear skin"],
    "cycle": "follicular",
    "dietaryRestrictions": ["gluten-free"],
    "extraThoughts": "I have PCOS and want to manage it naturally"
  }'
```

#### **Option B: Using Python requests**
```python
import requests
import json

url = "http://localhost:8000/api/v1/generate-workbook"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN"
}
data = {
    "symptoms": ["irregular periods", "weight gain", "acne"],
    "goals": ["regulate cycle", "lose weight", "clear skin"],
    "cycle": "follicular",
    "dietaryRestrictions": ["gluten-free"],
    "extraThoughts": "I have PCOS and want to manage it naturally"
}

response = requests.post(url, headers=headers, json=data)
print(json.dumps(response.json(), indent=2))
```

### **3. Frontend Testing**

#### **Option A: Through the App**
1. Start the frontend: `cd frontend/pcos-advice-app && npm run dev`
2. Go to the intake page
3. Fill out the form with test data
4. Check the workbook page for results

#### **Option B: Direct API Call from Frontend**
```javascript
// In browser console
fetch('/api/v1/generate-workbook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    symptoms: ['irregular periods', 'weight gain', 'acne'],
    goals: ['regulate cycle', 'lose weight', 'clear skin'],
    cycle: 'follicular',
    dietaryRestrictions: ['gluten-free'],
    extraThoughts: 'I have PCOS and want to manage it naturally'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🔍 **What to Look For**

### **1. Mechanism Detection**
- ✅ **1-3 mechanisms** generated (not more)
- ✅ **Confidence scores 70+** for all mechanisms
- ✅ **Relevant mechanisms** based on user symptoms
- ✅ **Clear descriptions** explaining each mechanism

### **2. Strategy Retrieval**
- ✅ **Mechanism-specific strategies** (if working)
- ✅ **Fallback to general strategies** (if mechanism-specific fails)
- ✅ **Strategy source tracking** (`mechanism_specific` vs `general_fallback`)

### **3. Intervention Creation**
- ✅ **Correct field mapping** (Strategy Name, What will you be doing, etc.)
- ✅ **Mechanism linking** (interventions linked to relevant mechanisms)
- ✅ **Rich descriptions** with explanations and tips

### **4. Coherence**
- ✅ **Mechanisms and interventions align** (e.g., "Insulin Resistance" → "Control blood sugar")
- ✅ **Logical connections** between problems and solutions
- ✅ **User-specific relevance** based on symptoms and goals

## 📊 **Test Scenarios**

### **Scenario 1: High Confidence User**
```json
{
  "symptoms": ["irregular periods", "weight gain", "acne", "insulin resistance"],
  "goals": ["regulate cycle", "lose weight", "clear skin"],
  "cycle": "follicular",
  "dietaryRestrictions": ["gluten-free"],
  "extraThoughts": "I have PCOS and want to manage it naturally"
}
```
**Expected**: 3 mechanisms, mechanism-specific strategies, high coherence

### **Scenario 2: Medium Confidence User**
```json
{
  "symptoms": ["mood swings", "fatigue"],
  "goals": ["feel better"],
  "cycle": "luteal",
  "dietaryRestrictions": [],
  "extraThoughts": "Not sure what's wrong"
}
```
**Expected**: 1-2 mechanisms, possibly fallback strategies

### **Scenario 3: Low Confidence User**
```json
{
  "symptoms": ["headaches"],
  "goals": ["feel better"],
  "cycle": "unknown",
  "dietaryRestrictions": [],
  "extraThoughts": ""
}
```
**Expected**: 1 mechanism or fallback to general strategies

## 🚨 **Common Issues to Watch For**

### **1. Field Mapping Errors**
- **Problem**: Empty descriptions or wrong field names
- **Check**: Look for "Strategy Name", "What will you be doing", "Why does it work"
- **Fix**: Verify CSV field names match code

### **2. Mechanism-Strategy Mismatch**
- **Problem**: Mechanisms don't match retrieved strategies
- **Check**: Look for coherence between mechanism titles and intervention titles
- **Fix**: Verify mechanism-specific query building

### **3. Empty Results**
- **Problem**: No mechanisms or interventions generated
- **Check**: Look for error messages in logs
- **Fix**: Verify GPT API key, vector store access, fallback logic

### **4. Fallback Not Working**
- **Problem**: Mechanism-specific retrieval fails but no fallback
- **Check**: Look for "strategy_source" field
- **Fix**: Verify fallback logic in generate_workbook_from_intake()

## 📝 **Debugging Tips**

### **1. Enable Detailed Logging**
The new system includes comprehensive logging:
```
=== MECHANISM-FIRST WORKBOOK GENERATION ===
Step 1: Generating mechanisms with GPT...
Generated 2 mechanisms
Step 2: Retrieving mechanism-specific strategies...
Found 3 mechanism-specific strategies
Step 3: Fallback to general strategies...
Step 4: Creating interventions from strategies...
Created 3 interventions
=== WORKBOOK GENERATION COMPLETE ===
```

### **2. Check Strategy Source**
Look for the `strategy_source` field in the response:
- `"mechanism_specific"` = Success, using mechanism-targeted strategies
- `"general_fallback"` = Fallback, using general strategies

### **3. Verify Field Mapping**
Check that interventions have proper descriptions:
- **Title**: Should show strategy name
- **Description**: Should include "What will you be doing", "Why", "Tips"
- **Mechanism ID**: Should be linked to a mechanism

## 🎯 **Success Criteria**

### **✅ Test Passes If:**
1. **Mechanisms Generated**: 1-3 mechanisms with confidence 70+
2. **Interventions Created**: At least 1 intervention per mechanism
3. **Coherence**: Mechanisms and interventions are logically connected
4. **Field Mapping**: Correct field names and rich descriptions
5. **Fallback Works**: System handles both mechanism-specific and general cases

### **❌ Test Fails If:**
1. **No Mechanisms**: GPT fails or returns empty results
2. **No Interventions**: Strategy retrieval fails completely
3. **Poor Coherence**: Mechanisms and interventions don't match
4. **Field Errors**: Empty or incorrect descriptions
5. **No Fallback**: System crashes when mechanism-specific retrieval fails

## 🚀 **Quick Start Testing**

1. **Start Backend**: `cd backend && python main.py`
2. **Run Test**: `python test_mechanism_first.py`
3. **Check Results**: Look for mechanisms, interventions, and coherence
4. **Verify Logs**: Check for detailed step-by-step logging
5. **Test Fallback**: Try with minimal data to test fallback logic

This comprehensive testing approach will help you verify the new mechanism-first architecture works correctly! 🎉
