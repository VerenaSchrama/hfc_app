#!/usr/bin/env python3
"""
Quick test script for the mechanism-first architecture.
Run this from the project root directory.
"""

import sys
import os
import json

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def quick_test():
    """Quick test of the mechanism-first architecture."""
    
    print("🧪 Quick Test: Mechanism-First Architecture")
    print("=" * 50)
    
    try:
        # Import the function
        from workbook_rag import generate_workbook_from_intake
        
        # Test data
        intake_data = {
            "symptoms": ["irregular periods", "weight gain", "acne"],
            "goals": ["regulate cycle", "lose weight", "clear skin"],
            "cycle": "follicular",
            "dietaryRestrictions": ["gluten-free"],
            "extraThoughts": "I have PCOS and want to manage it naturally"
        }
        
        print("📝 Test User Profile:")
        print(f"  Symptoms: {', '.join(intake_data['symptoms'])}")
        print(f"  Goals: {', '.join(intake_data['goals'])}")
        print(f"  Cycle: {intake_data['cycle']}")
        print()
        
        # Generate workbook
        print("🚀 Generating workbook...")
        workbook = generate_workbook_from_intake(999, intake_data)
        
        # Display results
        print("\n📊 RESULTS:")
        print("=" * 30)
        
        # Mechanisms
        mechanisms = workbook.get("mechanisms", [])
        print(f"🔬 Mechanisms ({len(mechanisms)}):")
        for i, mechanism in enumerate(mechanisms, 1):
            print(f"  {i}. {mechanism.get('title', 'Unknown')}")
            print(f"     Confidence: {mechanism.get('confidence_score', 0)}%")
            print(f"     Description: {mechanism.get('description', 'No description')[:80]}...")
            print()
        
        # Interventions
        interventions = workbook.get("interventions", [])
        print(f"💊 Interventions ({len(interventions)}):")
        for i, intervention in enumerate(interventions, 1):
            print(f"  {i}. {intervention.get('title', 'Unknown')}")
            print(f"     Description: {intervention.get('description', 'No description')[:80]}...")
            print(f"     Mechanism ID: {intervention.get('mechanism_id', 'Not linked')[:8]}...")
            print()
        
        # Strategy source
        strategy_source = workbook.get("strategy_source", "unknown")
        print(f"📋 Strategy Source: {strategy_source}")
        
        # Success check
        success = (
            len(mechanisms) > 0 and 
            len(interventions) > 0 and
            all(m.get('confidence_score', 0) >= 70 for m in mechanisms)
        )
        
        if success:
            print("\n✅ SUCCESS: Mechanism-first architecture working!")
            print("   - Mechanisms and interventions generated")
            print("   - High confidence mechanisms")
            print("   - Coherent structure")
        else:
            print("\n❌ ISSUES DETECTED:")
            if len(mechanisms) == 0:
                print("   - No mechanisms generated")
            if len(interventions) == 0:
                print("   - No interventions generated")
            if not all(m.get('confidence_score', 0) >= 70 for m in mechanisms):
                print("   - Low confidence mechanisms")
        
        return success
        
    except ImportError as e:
        print(f"❌ IMPORT ERROR: {e}")
        print("   Make sure you're running from the project root directory")
        print("   And that the backend dependencies are installed")
        return False
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Starting quick test...")
    success = quick_test()
    
    if success:
        print("\n🎉 Test completed successfully!")
        print("   The mechanism-first architecture is working!")
    else:
        print("\n💥 Test failed!")
        print("   Check the error messages above for issues")
        sys.exit(1)
