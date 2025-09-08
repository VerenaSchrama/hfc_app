#!/usr/bin/env python3
"""
Simple database test.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from models import Mechanism, Intervention
from db import SessionLocal
from datetime import datetime

def test_simple_db():
    """Test simple database operations."""
    
    print("🔍 Testing Simple Database Operations")
    print("=" * 40)
    
    try:
        print("📝 Step 1: Creating database session...")
        db = SessionLocal()
        print("✅ Database session created")
        
        print("📝 Step 2: Testing mechanism creation...")
        test_mechanism = Mechanism(
            user_id=999,
            title="Test Mechanism",
            description="Test description",
            status='suggested',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(test_mechanism)
        print("✅ Mechanism added to session")
        
        print("📝 Step 3: Testing intervention creation...")
        test_intervention = Intervention(
            user_id=999,
            mechanism_id=1,
            title="Test Intervention",
            description="Test description",
            status='suggested',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(test_intervention)
        print("✅ Intervention added to session")
        
        print("📝 Step 4: Committing to database...")
        db.commit()
        print("✅ Data committed to database")
        
        print("📝 Step 5: Verifying data...")
        mechanisms = db.query(Mechanism).filter(Mechanism.user_id == 999).all()
        interventions = db.query(Intervention).filter(Intervention.user_id == 999).all()
        
        print(f"📊 Found {len(mechanisms)} mechanisms and {len(interventions)} interventions")
        
        # Clean up test data
        for m in mechanisms:
            db.delete(m)
        for i in interventions:
            db.delete(i)
        db.commit()
        print("✅ Test data cleaned up")
        
        db.close()
        print("✅ Database test successful!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_simple_db()
