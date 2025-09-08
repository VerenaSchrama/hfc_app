#!/usr/bin/env python3
"""
Check existing users in Supabase.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from db import supabase

def check_users():
    """Check what users exist in the database."""
    
    print("🔍 Checking Users in Supabase")
    print("=" * 40)
    
    try:
        # Get all users
        response = supabase.table('users').select('id, email').execute()
        users = response.data or []
        
        print(f"📊 Found {len(users)} users:")
        for user in users:
            print(f"  - ID: {user['id']}, Email: {user['email']}")
        
        if len(users) == 0:
            print("❌ No users found! You need to create a user first.")
        else:
            print(f"✅ Use user ID {users[0]['id']} for testing")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_users()
