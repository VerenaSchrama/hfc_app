#!/usr/bin/env python3

import bcrypt
import sys
import os
sys.path.append('backend')

# Test password hashing and verification
test_password = "testpassword"
print(f"Test password: {test_password}")

# Hash the password like in registration
hashed_pw = bcrypt.hashpw(test_password.encode('utf-8'), bcrypt.gensalt())
print(f"Hashed password (bytes): {hashed_pw}")

# Store as string like we do in the database
stored_hash = hashed_pw.decode('utf-8')
print(f"Stored hash (string): {stored_hash}")

# Try verification like in login (current buggy way)
buggy_result = bcrypt.checkpw(test_password.encode('utf-8'), stored_hash.encode('utf-8'))
print(f"Buggy verification result: {buggy_result}")

# Try correct verification
correct_result = bcrypt.checkpw(test_password.encode('utf-8'), hashed_pw)
print(f"Correct verification result: {correct_result}")

# The fix: encode stored_hash back to bytes correctly
fixed_result = bcrypt.checkpw(test_password.encode('utf-8'), stored_hash.encode('utf-8'))
print(f"Fixed verification result: {fixed_result}")

# Test with a real database call
try:
    from db import SupabaseDB
    db_user = SupabaseDB.get_user_by_email("test@example.com")
    if db_user:
        print(f"Database user found: {db_user['email']}")
        print(f"Database hash: {db_user['hashed_password']}")
        
        # Test verification with database hash
        db_result = bcrypt.checkpw(test_password.encode('utf-8'), db_user['hashed_password'].encode('utf-8'))
        print(f"Database verification result: {db_result}")
    else:
        print("No user found in database")
except Exception as e:
    print(f"Database error: {e}")
