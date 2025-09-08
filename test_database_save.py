#!/usr/bin/env python3
"""
Test script to debug database saving issues.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from workbook_rag import generate_workbook_from_intake, save_workbook_to_db
from models import Mechanism, Intervention
from db import SessionLocal

def test_database_save():
    """Test if workbook generation and database saving works."""
    
    print("🔍 Testing Database Save Functionality")
    print("=" * 50)
    
    # Sample intake data
    intake_data = {
        "symptoms": ["irregular periods", "weight gain", "acne"],
        "goals": ["regulate cycle", "lose weight", "clear skin"],
        "cycle": "follicular",
        "dietaryRestrictions": ["gluten-free"],
        "extraThoughts": "I have PCOS and want to manage it naturally"
    }
    
    user_id = 2  # Test user ID (celina@herfoodcode.nl)
    
    try:
        print("📝 Step 1: Generating workbook...")
        workbook = generate_workbook_from_intake(user_id, intake_data)
        
        mechanisms = workbook.get("mechanisms", [])
        interventions = workbook.get("interventions", [])
        
        print(f"✅ Generated {len(mechanisms)} mechanisms and {len(interventions)} interventions")
        
        print("\n📝 Step 2: Saving to database...")
        success = save_workbook_to_db(user_id, workbook)
        
        if success:
            print("✅ Successfully saved to database!")
        else:
            print("❌ Failed to save to database!")
            return
        
        print("\n📝 Step 3: Verifying database contents...")
        from db import supabase
        
        # Check mechanisms
        mechanisms_response = supabase.table('mechanisms').select('*').eq('user_id', user_id).execute()
        mechanisms_in_db = mechanisms_response.data or []
        print(f"📊 Mechanisms in database: {len(mechanisms_in_db)}")
        for m in mechanisms_in_db:
            print(f"  - {m['title']} (status: {m['status']})")
        
        # Check interventions
        interventions_response = supabase.table('interventions').select('*').eq('user_id', user_id).execute()
        interventions_in_db = interventions_response.data or []
        print(f"📊 Interventions in database: {len(interventions_in_db)}")
        for i in interventions_in_db:
            print(f"  - {i['title']} (status: {i['status']})")
        
        if len(mechanisms_in_db) == 0 and len(interventions_in_db) == 0:
            print("❌ NO DATA SAVED TO DATABASE!")
            print("This suggests the save_workbook_to_db function is not working properly.")
        else:
            print("✅ Data successfully saved to database!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_database_save()
