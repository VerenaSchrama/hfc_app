# Strategy → Intervention Mapping Analysis

## 🎯 **Your Questions Answered**

### **1. Are strategies the interventions?**
**YES!** Strategies from the vector store become interventions in the workbook.

### **2. Are interventions now one of the strategies in the vector store?**
**YES!** Each intervention is created from a strategy retrieved from the `strategies_chroma` vector store.

### **3. How many does GPT pick to add to the workbook?**
- **Strategies**: 3 strategies retrieved (k=3 in vector search)
- **Mechanisms**: 3-5 mechanisms detected by GPT
- **Interventions**: 3 interventions (one per strategy)

---

## 📊 **Current System Analysis**

### **Strategy Retrieval Configuration**
```python
# In rag_pipeline.py
strategy_retriever = strategy_vectorstore.as_retriever(search_kwargs={"k": 3})
```
**Result**: Always retrieves **3 strategies** from the vector store

### **GPT Mechanism Detection**
```python
# In workbook_rag.py - GPT prompt
"Identify 3-5 key hormonal mechanisms that are most relevant to this user's profile."
```
**Result**: GPT detects **3-5 mechanisms** based on user profile

### **Intervention Creation**
```python
# In workbook_rag.py
for strategy in strategies:  # strategies = 3 items
    intervention = {
        "title": strategy.get('Strategy name', 'Nutrition Strategy'),
        "description": f"{strategy.get('Explanation', '')}\n\nWhy: {strategy.get('Why', '')}\n\nPractical tips: {strategy.get('Practical tips', '')}",
        # ... other fields
    }
    interventions.append(intervention)
```
**Result**: Creates **3 interventions** (one per strategy)

---

## 🔍 **Field Mapping Analysis**

### **Strategy CSV Structure:**
```csv
Strategy id,Strategy Name,What will you be doing,Why does it work,Symptoms,Sources,Category Source,Category Strategy,Specific symptoms,Tips for today,Recipes,Ziektebeeld
```

### **Current Mapping (INCORRECT):**
```python
# Current code tries to access wrong field names
"title": strategy.get('Strategy name', 'Nutrition Strategy'),  # ✅ Correct
"description": f"{strategy.get('Explanation', '')}\n\nWhy: {strategy.get('Why', '')}\n\nPractical tips: {strategy.get('Practical tips', '')}"
#                                                                                    ^^^^^^^^^^^^^^^^^^^^
#                                                                                    This field doesn't exist!
```

### **Correct Mapping Should Be:**
```python
intervention = {
    "title": strategy.get('Strategy Name', 'Nutrition Strategy'),
    "description": f"{strategy.get('What will you be doing', '')}\n\nWhy: {strategy.get('Why does it work', '')}\n\nPractical tips: {strategy.get('Tips for today', '')}",
    "category": strategy.get('Category Strategy', ''),
    "symptoms": strategy.get('Specific symptoms', ''),
    "source": strategy.get('Sources', ''),
    "mechanism_id": find_related_mechanism_advanced(strategy, mechanisms)
}
```

---

## 🚨 **Current Issues Found**

### **1. Field Name Mismatch**
- **Problem**: Code uses `'Explanation'`, `'Why'`, `'Practical tips'` but CSV has `'What will you be doing'`, `'Why does it work'`, `'Tips for today'`
- **Impact**: Descriptions are empty or show fallback text
- **Fix**: Update field names to match CSV structure

### **2. Missing Field Utilization**
- **Problem**: Many useful fields from CSV are not used
- **Missing**: `'Specific symptoms'`, `'Sources'`, `'Category Strategy'`, `'Recipes'`
- **Impact**: Less rich intervention data

### **3. Fixed Number of Interventions**
- **Problem**: Always creates exactly 3 interventions (k=3)
- **Impact**: No flexibility based on user needs
- **Consideration**: Should this be dynamic?

---

## 📈 **Complete Data Flow**

```
User Intake Data
    ↓
1. Strategy Retrieval (k=3) → 3 strategies from vector store
    ↓
2. GPT Mechanism Detection → 3-5 mechanisms from book content
    ↓
3. Intervention Creation → 3 interventions (1 per strategy)
    ↓
4. Mechanism Linking → Link interventions to relevant mechanisms
    ↓
5. Workbook Assembly → Final workbook with mechanisms + interventions
```

---

## 🎯 **Summary**

### **Current State:**
- ✅ **Strategies = Interventions**: Yes, each strategy becomes an intervention
- ✅ **Vector Store Source**: Yes, interventions come from strategies in vector store
- ✅ **Fixed Numbers**: 3 strategies → 3 interventions, 3-5 mechanisms
- ❌ **Field Mapping**: Incorrect field names causing empty descriptions
- ❌ **Rich Data**: Not utilizing all available strategy fields

### **Recommendations:**
1. **Fix Field Mapping**: Update field names to match CSV structure
2. **Utilize More Fields**: Use symptoms, sources, category, recipes
3. **Consider Dynamic k**: Maybe retrieve more/fewer strategies based on user needs
4. **Add Validation**: Ensure all required fields are present

The core concept is correct - strategies do become interventions - but the implementation needs field mapping fixes! 🔧
