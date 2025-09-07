#!/usr/bin/env python3
"""
API test script for the mechanism-first architecture.
Tests the actual API endpoints.
"""

import requests
import json
import time
import sys

def test_api():
    """Test the API endpoints for mechanism-first architecture."""
    
    print("🧪 API Test: Mechanism-First Architecture")
    print("=" * 50)
    
    # Configuration
    BASE_URL = "http://localhost:8000"
    API_URL = f"{BASE_URL}/api/v1/workbook/generate"
    
    # Test data
    test_data = {
        "symptoms": ["irregular periods", "weight gain", "acne"],
        "goals": ["regulate cycle", "lose weight", "clear skin"],
        "cycle": "follicular",
        "dietaryRestrictions": ["gluten-free"],
        "extraThoughts": "I have PCOS and want to manage it naturally"
    }
    
    print("📝 Test User Profile:")
    print(f"  Symptoms: {', '.join(test_data['symptoms'])}")
    print(f"  Goals: {', '.join(test_data['goals'])}")
    print(f"  Cycle: {test_data['cycle']}")
    print()
    
    try:
        # Test 1: Check if server is running
        print("🔍 Step 1: Checking if server is running...")
        try:
            response = requests.get(f"{BASE_URL}/docs", timeout=5)
            if response.status_code == 200:
                print("✅ Server is running")
            else:
                print("⚠️  Server responded but with unexpected status")
        except requests.exceptions.RequestException:
            print("❌ Server is not running!")
            print("   Start the server with: cd backend && python main.py")
            return False
        
        # Test 2: Generate workbook
        print("\n🚀 Step 2: Generating workbook via API...")
        
        headers = {
            "Content-Type": "application/json"
        }
        
        response = requests.post(API_URL, json=test_data, headers=headers, timeout=30)
        
        if response.status_code == 200:
            print("✅ API request successful")
            workbook = response.json()
        else:
            print(f"❌ API request failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        # Test 3: Analyze results
        print("\n📊 Step 3: Analyzing results...")
        
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
            print("\n✅ SUCCESS: API working correctly!")
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
        
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT: API request took too long")
        print("   This might indicate the GPT API is slow or failing")
        return False
        
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR: Cannot connect to server")
        print("   Make sure the server is running on localhost:8000")
        return False
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    print("Starting API test...")
    success = test_api()
    
    if success:
        print("\n🎉 API test completed successfully!")
        print("   The mechanism-first architecture is working via API!")
    else:
        print("\n💥 API test failed!")
        print("   Check the error messages above for issues")
        sys.exit(1)
