# Mechanism Limit Update: Max 3 with Confidence Filtering

## 🎯 **Changes Made**

### **1. Updated GPT Prompt**
- **Before**: "Identify 3-5 key hormonal mechanisms"
- **After**: "Identify 1-3 key hormonal mechanisms that are most relevant to this user's profile. Only include mechanisms you are confident about (confidence score 70+)"

### **2. Added Confidence Filtering**
- **Minimum Confidence**: 70+ required
- **Filtering Logic**: Only mechanisms with confidence >= 70 are included
- **Sorting**: Mechanisms sorted by confidence score (highest first)
- **Limit**: Maximum 3 mechanisms, but fewer if not confident

### **3. Enhanced Prompt Instructions**
```
IMPORTANT: Only include mechanisms with confidence score 70 or higher. 
If you're not confident about a mechanism, don't include it. 
It's better to have 1-2 high-confidence mechanisms than 3 low-confidence ones.
```

## 📊 **New Behavior**

### **Mechanism Detection Logic:**
1. **GPT Analysis**: Analyzes user profile + book content
2. **Confidence Scoring**: Each mechanism gets 70-100 confidence score
3. **Filtering**: Only mechanisms with confidence >= 70 are kept
4. **Sorting**: Sorted by confidence score (highest first)
5. **Limiting**: Maximum 3 mechanisms, but fewer if not confident

### **Expected Results:**
- **High Confidence User**: 3 mechanisms (all with confidence 70+)
- **Medium Confidence User**: 2 mechanisms (2 with confidence 70+)
- **Low Confidence User**: 1 mechanism (1 with confidence 70+)
- **Very Low Confidence User**: 0 mechanisms (fallback to keyword-based)

## 🔧 **Code Changes**

### **Updated Functions:**
1. **`create_mechanism_detection_prompt()`**: Updated prompt text
2. **`call_gpt_for_mechanisms()`**: Added confidence filtering and sorting

### **New Logic:**
```python
# Filter by confidence score
if confidence_score >= 70:
    mechanism = { ... }
    mechanisms.append(mechanism)

# Sort by confidence and limit to 3
mechanisms.sort(key=lambda x: x["confidence_score"], reverse=True)
mechanisms = mechanisms[:3]

print(f"GPT detected {len(mechanisms)} mechanisms with confidence >= 70")
```

## 🎯 **Benefits**

1. **Quality Over Quantity**: Better to have fewer, high-confidence mechanisms
2. **User-Specific**: Number of mechanisms adapts to user's profile clarity
3. **Confidence-Based**: Only includes mechanisms GPT is confident about
4. **Fallback Safety**: If no high-confidence mechanisms, falls back to keyword-based

## 📈 **Expected Impact**

- **More Accurate**: Only high-confidence mechanisms are included
- **Better UX**: Users get fewer, more relevant mechanisms
- **Adaptive**: Number of mechanisms varies based on confidence
- **Reliable**: Fallback ensures users always get some mechanisms

The system now prioritizes **quality over quantity** for mechanism detection! 🎯
