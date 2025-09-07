#!/usr/bin/env python3
"""
Final comprehensive test of the mechanism-first architecture.
Tests both the direct function calls and verifies all components work.
"""

import sys
import os
import json

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def final_test():
    """Comprehensive test of the mechanism-first architecture."""
    
    print("🧪 Final Comprehensive Test: Mechanism-First Architecture")
    print("=" * 60)
    
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
        print(f"  Dietary: {', '.join(intake_data['dietaryRestrictions'])}")
        print()
        
        # Generate workbook
        print("🚀 Generating workbook with mechanism-first approach...")
        workbook = generate_workbook_from_intake(999, intake_data)
        
        # Display results
        print("\n📊 DETAILED RESULTS:")
        print("=" * 40)
        
        # Mechanisms
        mechanisms = workbook.get("mechanisms", [])
        print(f"🔬 Mechanisms ({len(mechanisms)}):")
        for i, mechanism in enumerate(mechanisms, 1):
            print(f"  {i}. {mechanism.get('title', 'Unknown')}")
            print(f"     Confidence: {mechanism.get('confidence_score', 0)}%")
            print(f"     Description: {mechanism.get('description', 'No description')}")
            print(f"     Relevant Symptoms: {mechanism.get('relevant_symptoms', [])}")
            print(f"     Source Evidence: {mechanism.get('source_evidence', 'No evidence')[:100]}...")
            print()
        
        # Interventions
        interventions = workbook.get("interventions", [])
        print(f"💊 Interventions ({len(interventions)}):")
        for i, intervention in enumerate(interventions, 1):
            print(f"  {i}. {intervention.get('title', 'Unknown')}")
            print(f"     Description: {intervention.get('description', 'No description')}")
            print(f"     Mechanism ID: {intervention.get('mechanism_id', 'Not linked')}")
            print(f"     Confidence: {intervention.get('confidence_score', 0)}%")
            print()
        
        # Strategy source
        strategy_source = workbook.get("strategy_source", "unknown")
        print(f"📋 Strategy Source: {strategy_source}")
        
        # Coherence analysis
        print("\n🔍 COHERENCE ANALYSIS:")
        print("=" * 30)
        
        if len(mechanisms) > 0 and len(interventions) > 0:
            print("✅ Mechanisms and interventions generated")
            
            # Check if interventions are linked to mechanisms
            linked_interventions = 0
            for intervention in interventions:
                mechanism_id = intervention.get('mechanism_id', '')
                if mechanism_id and mechanism_id != 'Not linked':
                    linked_interventions += 1
            
            print(f"✅ {linked_interventions}/{len(interventions)} interventions linked to mechanisms")
            
            # Check mechanism-intervention coherence
            print("\n🔗 Mechanism-Intervention Coherence:")
            for mechanism in mechanisms:
                mechanism_id = mechanism.get('id', '')
                mechanism_title = mechanism.get('title', '')
                
                related_interventions = [
                    i for i in interventions 
                    if i.get('mechanism_id') == mechanism_id
                ]
                
                print(f"  {mechanism_title}: {len(related_interventions)} interventions")
                for intervention in related_interventions:
                    print(f"    - {intervention.get('title', 'Unknown')}")
        
        # Success criteria
        print("\n✅ SUCCESS CRITERIA CHECK:")
        print("=" * 35)
        
        criteria = {
            "Mechanisms Generated": len(mechanisms) > 0,
            "Interventions Generated": len(interventions) > 0,
            "High Confidence Mechanisms": all(m.get('confidence_score', 0) >= 70 for m in mechanisms),
            "Mechanism-Specific Strategies": strategy_source == "mechanism_specific",
            "Field Mapping Fixed": all(
                intervention.get('description', '') and 
                intervention.get('title', '') != 'Nutrition Strategy'
                for intervention in interventions
            ),
            "Coherent Structure": len(mechanisms) > 0 and len(interventions) > 0
        }
        
        for criterion, passed in criteria.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  {status}: {criterion}")
        
        # Overall success
        overall_success = all(criteria.values())
        
        if overall_success:
            print("\n🎉 ALL TESTS PASSED!")
            print("   The mechanism-first architecture is working perfectly!")
            print("   - Mechanisms and interventions are coherent")
            print("   - Field mapping is correct")
            print("   - Mechanism-specific strategy retrieval is working")
            print("   - High confidence mechanisms generated")
        else:
            print("\n⚠️  SOME TESTS FAILED!")
            failed_criteria = [k for k, v in criteria.items() if not v]
            print(f"   Failed criteria: {', '.join(failed_criteria)}")
        
        return overall_success
        
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
    print("Starting final comprehensive test...")
    success = final_test()
    
    if success:
        print("\n🎉 Final test completed successfully!")
        print("   The mechanism-first architecture is fully functional!")
    else:
        print("\n💥 Final test failed!")
        print("   Check the error messages above for issues")
        sys.exit(1)
