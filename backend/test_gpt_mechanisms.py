#!/usr/bin/env python3
"""
Test script for GPT-based mechanism detection
Run this to test the new mechanism detection system
"""

import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

from workbook_rag import test_mechanism_detection, generate_mechanisms_with_gpt

def main():
    """Test the GPT-based mechanism detection system."""
    
    print("🧪 Testing GPT-based Mechanism Detection")
    print("=" * 50)
    
    # Check if OpenAI API key is available
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Error: OPENAI_API_KEY not found in environment variables")
        print("Please set your OpenAI API key in the .env file")
        return
    
    print("✅ OpenAI API key found")
    
    # Test cases
    test_cases = [
        {
            "name": "PCOS User",
            "intake": {
                "symptoms": ["irregular periods", "weight gain", "acne", "mood swings"],
                "goals": ["balance hormones", "lose weight", "clear skin"],
                "cycle": "irregular",
                "extraThoughts": "diagnosed with PCOS, struggling with insulin resistance"
            }
        },
        {
            "name": "Thyroid Issues",
            "intake": {
                "symptoms": ["fatigue", "weight gain", "hair loss", "cold intolerance"],
                "goals": ["increase energy", "lose weight", "improve metabolism"],
                "cycle": "luteal",
                "extraThoughts": "suspected thyroid issues, always tired"
            }
        },
        {
            "name": "Stress & Adrenal",
            "intake": {
                "symptoms": ["anxiety", "sleep problems", "irregular cycles", "cravings"],
                "goals": ["reduce stress", "better sleep", "balance hormones"],
                "cycle": "irregular",
                "extraThoughts": "high stress job, adrenal fatigue symptoms"
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🔍 Test Case {i}: {test_case['name']}")
        print("-" * 30)
        
        try:
            mechanisms = generate_mechanisms_with_gpt(1, test_case['intake'], "test context")
            
            if mechanisms:
                print(f"✅ Detected {len(mechanisms)} mechanisms:")
                for j, mechanism in enumerate(mechanisms, 1):
                    print(f"\n{j}. {mechanism['title']}")
                    print(f"   Confidence: {mechanism['confidence_score']}%")
                    print(f"   Category: {mechanism['category']}")
                    print(f"   Description: {mechanism['description']}")
                    print(f"   Relevant Symptoms: {mechanism['relevant_symptoms']}")
                    if mechanism.get('source_evidence'):
                        print(f"   Source Evidence: {mechanism['source_evidence'][:100]}...")
            else:
                print("❌ No mechanisms detected")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Test completed!")

if __name__ == "__main__":
    main()
