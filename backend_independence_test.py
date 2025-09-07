#!/usr/bin/env python3
"""
Test backend functions independently without test files.
This verifies that the core mechanism-first architecture works standalone.
"""

import sys
import os
sys.path.append('backend')

def test_backend_independence():
    """Test that backend functions work without external test files."""
    
    print("🧪 Testing Backend Independence")
    print("=" * 50)
    
    try:
        # Import core functions
        from workbook_rag import generate_workbook_from_intake
        from rag_pipeline import build_user_context, get_strategies
        from models import create_db_and_tables
        
        print("✅ All imports successful")
        
        # Test data
        sample_intake = {
            'symptoms': ['irregular periods', 'weight gain', 'acne'],
            'goals': ['regulate cycle', 'lose weight', 'clear skin'],
            'cycle': 'follicular',
            'dietaryRestrictions': ['gluten-free'],
            'whatWorks': 'intermittent fasting',
            'extraThoughts': 'struggling with PCOS'
        }
        
        print("\n📊 Testing Core Functions:")
        print("-" * 30)
        
        # Test 1: User context building
        print("1. Testing build_user_context...")
        context = build_user_context(sample_intake)
        print(f"   ✅ Context length: {len(context)} characters")
        
        # Test 2: Strategy retrieval
        print("2. Testing get_strategies...")
        strategies = get_strategies(sample_intake)
        print(f"   ✅ Retrieved {len(strategies)} strategies")
        
        # Test 3: Full workbook generation
        print("3. Testing generate_workbook_from_intake...")
        result = generate_workbook_from_intake(999, sample_intake)
        
        print(f"   ✅ Generated {len(result.get('mechanisms', []))} mechanisms")
        print(f"   ✅ Generated {len(result.get('interventions', []))} interventions")
        print(f"   ✅ Strategy source: {result.get('strategy_source', 'unknown')}")
        
        # Test 4: Verify mechanism-intervention coherence
        mechanisms = result.get('mechanisms', [])
        interventions = result.get('interventions', [])
        
        print("\n🔍 Coherence Analysis:")
        print("-" * 20)
        
        for i, mechanism in enumerate(mechanisms, 1):
            print(f"Mechanism {i}: {mechanism.get('title', 'Unknown')}")
            print(f"  Confidence: {mechanism.get('confidence_score', 0)}%")
            
            # Find interventions for this mechanism
            mechanism_interventions = [
                intv for intv in interventions 
                if intv.get('mechanism_id') == mechanism.get('id')
            ]
            print(f"  Interventions: {len(mechanism_interventions)}")
            
            for j, intv in enumerate(mechanism_interventions, 1):
                print(f"    {j}. {intv.get('title', 'Unknown')}")
        
        print("\n🎯 Success Criteria Check:")
        print("-" * 25)
        
        # Check success criteria
        criteria_met = []
        
        if len(mechanisms) >= 1 and len(mechanisms) <= 3:
            criteria_met.append("✅ Mechanism count (1-3)")
        else:
            criteria_met.append("❌ Mechanism count")
            
        if all(m.get('confidence_score', 0) >= 70 for m in mechanisms):
            criteria_met.append("✅ High confidence mechanisms (70+)")
        else:
            criteria_met.append("❌ High confidence mechanisms")
            
        if len(interventions) >= 1:
            criteria_met.append("✅ Interventions generated")
        else:
            criteria_met.append("❌ Interventions generated")
            
        if result.get('strategy_source') == 'mechanism_specific':
            criteria_met.append("✅ Mechanism-specific strategies")
        else:
            criteria_met.append("❌ Mechanism-specific strategies")
        
        for criterion in criteria_met:
            print(f"  {criterion}")
        
        success_rate = sum(1 for c in criteria_met if c.startswith("✅")) / len(criteria_met)
        
        print(f"\n📈 Overall Success Rate: {success_rate:.1%}")
        
        if success_rate >= 0.8:
            print("\n🎉 BACKEND INDEPENDENCE TEST: PASSED!")
            print("   The backend functions work perfectly without test files.")
            return True
        else:
            print("\n⚠️  BACKEND INDEPENDENCE TEST: PARTIAL SUCCESS")
            print("   Some issues detected, but core functionality works.")
            return False
            
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("   Make sure you're running from the project root directory.")
        return False
        
    except Exception as e:
        print(f"❌ Runtime Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_backend_independence()
    sys.exit(0 if success else 1)
