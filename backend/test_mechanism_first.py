#!/usr/bin/env python3
"""
Test script for the new mechanism-first architecture.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from workbook_rag import generate_workbook_from_intake

def test_mechanism_first_architecture():
    """Test the new mechanism-first workbook generation."""
    
    print("🧪 Testing Mechanism-First Architecture")
    print("=" * 50)
    
    # Sample user intake data
    intake_data = {
        "symptoms": ["irregular periods", "weight gain", "acne"],
        "goals": ["regulate cycle", "lose weight", "clear skin"],
        "cycle": "follicular",
        "dietaryRestrictions": ["gluten-free"],
        "extraThoughts": "I have PCOS and want to manage it naturally"
    }
    
    user_id = 999  # Test user ID
    
    try:
        print("📝 Sample User Profile:")
        print(f"  Symptoms: {', '.join(intake_data['symptoms'])}")
        print(f"  Goals: {', '.join(intake_data['goals'])}")
        print(f"  Cycle: {intake_data['cycle']}")
        print(f"  Dietary: {', '.join(intake_data['dietaryRestrictions'])}")
        print()
        
        # Generate workbook using new mechanism-first approach
        print("🚀 Generating workbook with mechanism-first approach...")
        workbook = generate_workbook_from_intake(user_id, intake_data)
        
        print("\n📊 RESULTS:")
        print("=" * 30)
        
        # Display mechanisms
        mechanisms = workbook.get("mechanisms", [])
        print(f"🔬 Mechanisms ({len(mechanisms)}):")
        for i, mechanism in enumerate(mechanisms, 1):
            print(f"  {i}. {mechanism.get('title', 'Unknown')}")
            print(f"     Confidence: {mechanism.get('confidence_score', 0)}%")
            print(f"     Description: {mechanism.get('description', 'No description')[:100]}...")
            print()
        
        # Display interventions
        interventions = workbook.get("interventions", [])
        print(f"💊 Interventions ({len(interventions)}):")
        for i, intervention in enumerate(interventions, 1):
            print(f"  {i}. {intervention.get('title', 'Unknown')}")
            print(f"     Description: {intervention.get('description', 'No description')[:100]}...")
            print(f"     Mechanism ID: {intervention.get('mechanism_id', 'Not linked')}")
            print()
        
        # Display strategy source
        strategy_source = workbook.get("strategy_source", "unknown")
        print(f"📋 Strategy Source: {strategy_source}")
        
        # Analysis
        print("\n🔍 ANALYSIS:")
        print("=" * 20)
        
        if strategy_source == "mechanism_specific":
            print("✅ SUCCESS: Used mechanism-specific strategy retrieval")
            print("   - Mechanisms and interventions should be well-aligned")
            print("   - Higher coherence between problems and solutions")
        else:
            print("⚠️  FALLBACK: Used general strategy retrieval")
            print("   - Mechanism-specific retrieval may have failed")
            print("   - Still functional but potentially less coherent")
        
        if len(mechanisms) > 0 and len(interventions) > 0:
            print("✅ SUCCESS: Generated both mechanisms and interventions")
        else:
            print("❌ ERROR: Missing mechanisms or interventions")
        
        print(f"\n📈 Summary:")
        print(f"   - Mechanisms: {len(mechanisms)}")
        print(f"   - Interventions: {len(interventions)}")
        print(f"   - Strategy Source: {strategy_source}")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_mechanism_first_architecture()
    if success:
        print("\n🎉 Test completed successfully!")
    else:
        print("\n💥 Test failed!")
        sys.exit(1)
