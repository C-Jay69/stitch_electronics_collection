#!/usr/bin/env python3
"""
PawPlan AI Phase 2 Backend Testing
Tests: Auth, User Isolation, Tier Limits, Stripe Payments, Admin RBAC, Regressions
"""
import httpx
import time
import sys

# Configuration
BASE_URL = "https://pawplan-main.preview.emergentagent.com/api"
TIMEOUT_LLM = 120  # For LLM endpoints
TIMEOUT_NORMAL = 30  # For regular endpoints

# Test results tracking
passed = 0
failed = 0
test_results = []

def log_test(name, success, message=""):
    global passed, failed, test_results
    if success:
        passed += 1
        status = "✅ PASS"
    else:
        failed += 1
        status = "❌ FAIL"
    result = f"{status}: {name}"
    if message:
        result += f" - {message}"
    print(result)
    test_results.append(result)

def test_auth():
    """Part A: Auth tests"""
    print("\n" + "="*80)
    print("PART A — AUTH")
    print("="*80)
    
    # Test 1: POST /api/seed
    print("\n[Test 1] POST /api/seed")
    try:
        resp = httpx.post(f"{BASE_URL}/seed", timeout=TIMEOUT_NORMAL)
        data = resp.json()
        if resp.status_code == 200 and data.get("ok") and "adminEmail" in data:
            log_test("Seed endpoint", True, f"Admin email: {data['adminEmail']}")
        else:
            log_test("Seed endpoint", False, f"Unexpected response: {data}")
    except Exception as e:
        log_test("Seed endpoint", False, str(e))
    
    # Test 2: POST /api/auth/register (Alice)
    print("\n[Test 2] POST /api/auth/register (Alice)")
    alice_session = httpx.Client(timeout=TIMEOUT_NORMAL)
    try:
        resp = alice_session.post(f"{BASE_URL}/auth/register", json={
            "email": "alice@test.com",
            "password": "alice12345",
            "name": "Alice"
        })
        data = resp.json()
        if resp.status_code == 200 and "user" in data:
            user = data["user"]
            if user.get("tier") == "free" and user.get("mustChangePassword") == False:
                log_test("Alice registration", True, f"User ID: {user['id']}, tier: {user['tier']}")
                alice_id = user["id"]
            else:
                log_test("Alice registration", False, f"Unexpected user data: {user}")
        else:
            log_test("Alice registration", False, f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        log_test("Alice registration", False, str(e))
    
    # Test 3: Re-register same email -> 409
    print("\n[Test 3] Re-register same email -> 409")
    try:
        resp = httpx.post(f"{BASE_URL}/auth/register", json={
            "email": "alice@test.com",
            "password": "alice12345",
            "name": "Alice"
        }, timeout=TIMEOUT_NORMAL)
        if resp.status_code == 409:
            log_test("Duplicate email rejection", True, "Got 409 as expected")
        else:
            log_test("Duplicate email rejection", False, f"Expected 409, got {resp.status_code}")
    except Exception as e:
        log_test("Duplicate email rejection", False, str(e))
    
    # Test 4: Password too short -> 400
    print("\n[Test 4] Password too short -> 400")
    try:
        resp = httpx.post(f"{BASE_URL}/auth/register", json={
            "email": "short@test.com",
            "password": "12345",  # Only 5 chars
            "name": "Short"
        }, timeout=TIMEOUT_NORMAL)
        if resp.status_code == 400:
            log_test("Short password rejection", True, "Got 400 as expected")
        else:
            log_test("Short password rejection", False, f"Expected 400, got {resp.status_code}")
    except Exception as e:
        log_test("Short password rejection", False, str(e))
    
    # Test 5: POST /api/auth/login (wrong password -> 401, correct -> 200)
    print("\n[Test 5] POST /api/auth/login")
    try:
        # Wrong password
        resp = httpx.post(f"{BASE_URL}/auth/login", json={
            "email": "alice@test.com",
            "password": "wrongpassword"
        }, timeout=TIMEOUT_NORMAL)
        if resp.status_code == 401:
            log_test("Login with wrong password", True, "Got 401 as expected")
        else:
            log_test("Login with wrong password", False, f"Expected 401, got {resp.status_code}")
        
        # Correct password
        resp = alice_session.post(f"{BASE_URL}/auth/login", json={
            "email": "alice@test.com",
            "password": "alice12345"
        })
        if resp.status_code == 200 and "user" in resp.json():
            log_test("Login with correct password", True, "Successfully logged in")
        else:
            log_test("Login with correct password", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Login tests", False, str(e))
    
    # Test 6: GET /api/auth/me (with/without cookie)
    print("\n[Test 6] GET /api/auth/me")
    try:
        # With cookie (Alice's session)
        resp = alice_session.get(f"{BASE_URL}/auth/me")
        data = resp.json()
        if resp.status_code == 200 and data.get("user") and data["user"].get("email") == "alice@test.com":
            log_test("GET /auth/me with cookie", True, f"Got user: {data['user']['email']}")
        else:
            log_test("GET /auth/me with cookie", False, f"Unexpected response: {data}")
        
        # Without cookie
        resp = httpx.get(f"{BASE_URL}/auth/me", timeout=TIMEOUT_NORMAL)
        data = resp.json()
        if resp.status_code == 200 and data.get("user") is None:
            log_test("GET /auth/me without cookie", True, "Got null user as expected")
        else:
            log_test("GET /auth/me without cookie", False, f"Expected null user, got: {data}")
    except Exception as e:
        log_test("GET /auth/me tests", False, str(e))
    
    # Test 7: POST /api/auth/logout
    print("\n[Test 7] POST /api/auth/logout")
    try:
        resp = alice_session.post(f"{BASE_URL}/auth/logout")
        if resp.status_code == 200:
            # Verify cookie cleared
            resp = alice_session.get(f"{BASE_URL}/auth/me")
            data = resp.json()
            if data.get("user") is None:
                log_test("Logout", True, "Cookie cleared, /me returns null")
            else:
                log_test("Logout", False, "Cookie not cleared properly")
        else:
            log_test("Logout", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Logout", False, str(e))
    
    # Test 8: Re-login Alice
    print("\n[Test 8] Re-login Alice")
    try:
        resp = alice_session.post(f"{BASE_URL}/auth/login", json={
            "email": "alice@test.com",
            "password": "alice12345"
        })
        if resp.status_code == 200:
            log_test("Alice re-login", True, "Successfully re-logged in")
        else:
            log_test("Alice re-login", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Alice re-login", False, str(e))
    
    # Test 9: Admin login
    print("\n[Test 9] Admin login")
    admin_session = httpx.Client(timeout=TIMEOUT_NORMAL)
    try:
        resp = admin_session.post(f"{BASE_URL}/auth/login", json={
            "email": "admin@pawplan.ai",
            "password": "ChangeMe123!"
        })
        data = resp.json()
        if resp.status_code == 200 and "user" in data:
            user = data["user"]
            if user.get("role") == "admin" and user.get("mustChangePassword") == True and user.get("tier") == "premium":
                log_test("Admin login", True, f"Role: {user['role']}, mustChangePassword: {user['mustChangePassword']}, tier: {user['tier']}")
                admin_id = user["id"]
            else:
                log_test("Admin login", False, f"Unexpected user data: {user}")
        else:
            log_test("Admin login", False, f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        log_test("Admin login", False, str(e))
    
    # Test 10: Admin change password + reset
    print("\n[Test 10] Admin change password + reset")
    try:
        # Change password (no currentPassword needed because mustChangePassword=true)
        resp = admin_session.post(f"{BASE_URL}/auth/change-password", json={
            "newPassword": "NewAdminPass1!"
        })
        if resp.status_code == 200:
            log_test("Admin change password", True, "Password changed")
            
            # Verify old password doesn't work
            test_session = httpx.Client(timeout=TIMEOUT_NORMAL)
            resp = test_session.post(f"{BASE_URL}/auth/login", json={
                "email": "admin@pawplan.ai",
                "password": "ChangeMe123!"
            })
            if resp.status_code == 401:
                log_test("Old admin password rejected", True, "Old password doesn't work")
            else:
                log_test("Old admin password rejected", False, f"Old password still works: {resp.status_code}")
            
            # Verify new password works and mustChangePassword is false
            resp = test_session.post(f"{BASE_URL}/auth/login", json={
                "email": "admin@pawplan.ai",
                "password": "NewAdminPass1!"
            })
            data = resp.json()
            if resp.status_code == 200 and data.get("user", {}).get("mustChangePassword") == False:
                log_test("New admin password works", True, "mustChangePassword now false")
                
                # RESET password back to ChangeMe123!
                resp = test_session.post(f"{BASE_URL}/auth/change-password", json={
                    "currentPassword": "NewAdminPass1!",
                    "newPassword": "ChangeMe123!"
                })
                if resp.status_code == 200:
                    log_test("Admin password reset", True, "Password reset to ChangeMe123!")
                    # Update admin_session to use old password
                    admin_session = httpx.Client(timeout=TIMEOUT_NORMAL)
                    admin_session.post(f"{BASE_URL}/auth/login", json={
                        "email": "admin@pawplan.ai",
                        "password": "ChangeMe123!"
                    })
                else:
                    log_test("Admin password reset", False, f"Failed to reset: {resp.status_code}")
            else:
                log_test("New admin password works", False, f"Status: {resp.status_code}, mustChangePassword: {data.get('user', {}).get('mustChangePassword')}")
        else:
            log_test("Admin change password", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Admin password change/reset", False, str(e))
    
    return alice_session, admin_session

def test_user_isolation(alice_session, admin_session):
    """Part B: User Isolation tests"""
    print("\n" + "="*80)
    print("PART B — USER ISOLATION")
    print("="*80)
    
    alice_dog_id = None
    bob_dog_id = None
    
    # Test 11: Alice creates dog Alfie
    print("\n[Test 11] Alice creates dog Alfie")
    try:
        resp = alice_session.post(f"{BASE_URL}/dogs", json={
            "name": "Alfie",
            "breed": "Beagle",
            "ageYears": 3,
            "weightKg": 14
        })
        data = resp.json()
        if resp.status_code == 200 and data.get("name") == "Alfie":
            alice_dog_id = data["id"]
            log_test("Alice creates Alfie", True, f"Dog ID: {alice_dog_id}")
        else:
            log_test("Alice creates Alfie", False, f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        log_test("Alice creates Alfie", False, str(e))
    
    # Test 12: Bob registers and creates dog Buster
    print("\n[Test 12] Bob registers and creates dog Buster")
    bob_session = httpx.Client(timeout=TIMEOUT_NORMAL)
    try:
        resp = bob_session.post(f"{BASE_URL}/auth/register", json={
            "email": "bob@test.com",
            "password": "bob12345",
            "name": "Bob"
        })
        if resp.status_code == 200:
            log_test("Bob registration", True, "Bob registered")
            
            resp = bob_session.post(f"{BASE_URL}/dogs", json={
                "name": "Buster",
                "breed": "Boxer"
            })
            data = resp.json()
            if resp.status_code == 200 and data.get("name") == "Buster":
                bob_dog_id = data["id"]
                log_test("Bob creates Buster", True, f"Dog ID: {bob_dog_id}")
            else:
                log_test("Bob creates Buster", False, f"Status: {resp.status_code}")
        else:
            log_test("Bob registration", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Bob registration and dog creation", False, str(e))
    
    # Test 13: Alice GET /api/dogs (should see Alfie + Truffle, not Buster)
    print("\n[Test 13] Alice GET /api/dogs")
    try:
        resp = alice_session.get(f"{BASE_URL}/dogs")
        data = resp.json()
        if resp.status_code == 200:
            dog_names = [d.get("name") for d in data]
            has_alfie = "Alfie" in dog_names
            has_truffle = "Truffle" in dog_names
            has_buster = "Buster" in dog_names
            if has_alfie and has_truffle and not has_buster:
                log_test("Alice sees own dogs + demo", True, f"Dogs: {dog_names}")
            else:
                log_test("Alice sees own dogs + demo", False, f"Expected Alfie+Truffle, not Buster. Got: {dog_names}")
        else:
            log_test("Alice sees own dogs + demo", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Alice sees own dogs + demo", False, str(e))
    
    # Test 14: Bob GET /api/dogs (should see Buster + Truffle, not Alfie)
    print("\n[Test 14] Bob GET /api/dogs")
    try:
        resp = bob_session.get(f"{BASE_URL}/dogs")
        data = resp.json()
        if resp.status_code == 200:
            dog_names = [d.get("name") for d in data]
            has_buster = "Buster" in dog_names
            has_truffle = "Truffle" in dog_names
            has_alfie = "Alfie" in dog_names
            if has_buster and has_truffle and not has_alfie:
                log_test("Bob sees own dogs + demo", True, f"Dogs: {dog_names}")
            else:
                log_test("Bob sees own dogs + demo", False, f"Expected Buster+Truffle, not Alfie. Got: {dog_names}")
        else:
            log_test("Bob sees own dogs + demo", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Bob sees own dogs + demo", False, str(e))
    
    # Test 15: Alice GET Bob's dog -> 403
    print("\n[Test 15] Alice GET Bob's dog -> 403")
    try:
        if bob_dog_id:
            resp = alice_session.get(f"{BASE_URL}/dogs/{bob_dog_id}")
            if resp.status_code == 403:
                log_test("Alice GET Bob's dog forbidden", True, "Got 403 as expected")
            else:
                log_test("Alice GET Bob's dog forbidden", False, f"Expected 403, got {resp.status_code}")
        else:
            log_test("Alice GET Bob's dog forbidden", False, "Bob's dog ID not available")
    except Exception as e:
        log_test("Alice GET Bob's dog forbidden", False, str(e))
    
    # Test 16: Alice DELETE Bob's dog -> 403
    print("\n[Test 16] Alice DELETE Bob's dog -> 403")
    try:
        if bob_dog_id:
            resp = alice_session.delete(f"{BASE_URL}/dogs/{bob_dog_id}")
            if resp.status_code == 403:
                log_test("Alice DELETE Bob's dog forbidden", True, "Got 403 as expected")
            else:
                log_test("Alice DELETE Bob's dog forbidden", False, f"Expected 403, got {resp.status_code}")
        else:
            log_test("Alice DELETE Bob's dog forbidden", False, "Bob's dog ID not available")
    except Exception as e:
        log_test("Alice DELETE Bob's dog forbidden", False, str(e))
    
    # Test 17: Alice GET demo-truffle -> 200
    print("\n[Test 17] Alice GET demo-truffle -> 200")
    try:
        resp = alice_session.get(f"{BASE_URL}/dogs/demo-truffle")
        if resp.status_code == 200:
            data = resp.json()
            if data.get("name") == "Truffle":
                log_test("Alice GET demo dog", True, "Demo dog accessible")
            else:
                log_test("Alice GET demo dog", False, f"Unexpected data: {data}")
        else:
            log_test("Alice GET demo dog", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Alice GET demo dog", False, str(e))
    
    return bob_session, bob_dog_id

def test_tier_limits(alice_session):
    """Part C: Tier Limits tests"""
    print("\n" + "="*80)
    print("PART C — TIER LIMITS")
    print("="*80)
    
    initial_plan_count = 0
    
    # Test 18: Alice GET /api/usage
    print("\n[Test 18] Alice GET /api/usage")
    try:
        resp = alice_session.get(f"{BASE_URL}/usage")
        data = resp.json()
        if resp.status_code == 200:
            tier = data.get("tier")
            plans = data.get("plans", {})
            chats = data.get("chats", {})
            if tier == "free" and plans.get("limit") == 2 and chats.get("limit") == 30:
                log_test("Alice usage endpoint", True, f"Tier: {tier}, Plans: {plans['used']}/{plans['limit']}, Chats: {chats['used']}/{chats['limit']}")
                initial_plan_count = plans.get("used", 0)
            else:
                log_test("Alice usage endpoint", False, f"Unexpected limits: {data}")
        else:
            log_test("Alice usage endpoint", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Alice usage endpoint", False, str(e))
    
    # Test 19: Generate 1 plan and verify usage increments
    print("\n[Test 19] Generate plan and verify usage increments")
    try:
        # Generate a plan
        resp = alice_session.post(f"{BASE_URL}/plans/generate", json={
            "dogId": "demo-truffle",
            "planType": "combined"
        }, timeout=TIMEOUT_LLM)
        if resp.status_code == 200:
            log_test("Plan generation", True, "Plan generated successfully")
            
            # Check usage again
            resp = alice_session.get(f"{BASE_URL}/usage")
            data = resp.json()
            if resp.status_code == 200:
                new_plan_count = data.get("plans", {}).get("used", 0)
                if new_plan_count > initial_plan_count:
                    log_test("Usage increment", True, f"Plan count increased from {initial_plan_count} to {new_plan_count}")
                else:
                    log_test("Usage increment", False, f"Plan count didn't increase: {initial_plan_count} -> {new_plan_count}")
            else:
                log_test("Usage increment", False, "Failed to get usage after plan generation")
        else:
            log_test("Plan generation", False, f"Status: {resp.status_code}, Response: {resp.text[:200]}")
    except Exception as e:
        log_test("Plan generation and usage", False, str(e))

def test_stripe_payments(alice_session):
    """Part D: Stripe Payments tests"""
    print("\n" + "="*80)
    print("PART D — STRIPE PAYMENTS")
    print("="*80)
    
    session_id_monthly = None
    
    # Test 20: Alice checkout monthly
    print("\n[Test 20] Alice checkout monthly")
    try:
        resp = alice_session.post(f"{BASE_URL}/payments/checkout", json={
            "plan": "monthly",
            "originUrl": "https://pawplan-main.preview.emergentagent.com"
        })
        data = resp.json()
        if resp.status_code == 200 and "url" in data and "sessionId" in data:
            if data["url"].startswith("https://checkout.stripe.com"):
                session_id_monthly = data["sessionId"]
                log_test("Checkout monthly", True, f"Session ID: {session_id_monthly[:20]}...")
            else:
                log_test("Checkout monthly", False, f"URL doesn't start with stripe checkout: {data['url']}")
        else:
            log_test("Checkout monthly", False, f"Status: {resp.status_code}, Response: {data}")
    except Exception as e:
        log_test("Checkout monthly", False, str(e))
    
    # Test 21: Alice checkout yearly
    print("\n[Test 21] Alice checkout yearly")
    try:
        resp = alice_session.post(f"{BASE_URL}/payments/checkout", json={
            "plan": "yearly",
            "originUrl": "https://pawplan-main.preview.emergentagent.com"
        })
        data = resp.json()
        if resp.status_code == 200 and "url" in data:
            if data["url"].startswith("https://checkout.stripe.com"):
                log_test("Checkout yearly", True, "Yearly checkout URL generated")
            else:
                log_test("Checkout yearly", False, f"URL doesn't start with stripe checkout: {data['url']}")
        else:
            log_test("Checkout yearly", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Checkout yearly", False, str(e))
    
    # Test 22: Invalid plan -> 400
    print("\n[Test 22] Invalid plan -> 400")
    try:
        resp = alice_session.post(f"{BASE_URL}/payments/checkout", json={
            "plan": "invalid",
            "originUrl": "https://pawplan-main.preview.emergentagent.com"
        })
        if resp.status_code == 400:
            log_test("Invalid plan rejection", True, "Got 400 as expected")
        else:
            log_test("Invalid plan rejection", False, f"Expected 400, got {resp.status_code}")
    except Exception as e:
        log_test("Invalid plan rejection", False, str(e))
    
    # Test 23: GET status with valid sessionId
    print("\n[Test 23] GET status with valid sessionId")
    try:
        if session_id_monthly:
            resp = alice_session.get(f"{BASE_URL}/payments/status/{session_id_monthly}")
            if resp.status_code == 200:
                data = resp.json()
                log_test("Payment status check", True, f"Status: {data.get('payment_status', 'unknown')}")
            else:
                log_test("Payment status check", False, f"Status: {resp.status_code}")
        else:
            log_test("Payment status check", False, "No session ID available")
    except Exception as e:
        log_test("Payment status check", False, str(e))
    
    # Test 24: GET status with invalid sessionId -> error
    print("\n[Test 24] GET status with invalid sessionId")
    try:
        resp = alice_session.get(f"{BASE_URL}/payments/status/cs_test_doesnotexist")
        if resp.status_code != 200:
            log_test("Invalid session status", True, f"Got error status {resp.status_code} as expected")
        else:
            log_test("Invalid session status", False, "Expected error, got 200")
    except Exception as e:
        log_test("Invalid session status", False, str(e))
    
    # Test 25: GET payment history
    print("\n[Test 25] GET payment history")
    try:
        resp = alice_session.get(f"{BASE_URL}/payments/history")
        data = resp.json()
        if resp.status_code == 200 and isinstance(data, list):
            if len(data) >= 2:
                log_test("Payment history", True, f"Found {len(data)} transactions")
            else:
                log_test("Payment history", False, f"Expected at least 2 transactions, got {len(data)}")
        else:
            log_test("Payment history", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Payment history", False, str(e))
    
    # Test 26: POST cancel subscription
    print("\n[Test 26] POST cancel subscription")
    try:
        resp = alice_session.post(f"{BASE_URL}/payments/cancel")
        if resp.status_code == 200:
            log_test("Cancel subscription", True, "Subscription cancelled")
        else:
            log_test("Cancel subscription", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Cancel subscription", False, str(e))
    
    # Test 27: Checkout without auth -> 401
    print("\n[Test 27] Checkout without auth -> 401")
    try:
        resp = httpx.post(f"{BASE_URL}/payments/checkout", json={
            "plan": "monthly"
        }, timeout=TIMEOUT_NORMAL)
        if resp.status_code == 401:
            log_test("Checkout without auth", True, "Got 401 as expected")
        else:
            log_test("Checkout without auth", False, f"Expected 401, got {resp.status_code}")
    except Exception as e:
        log_test("Checkout without auth", False, str(e))

def test_admin_rbac(alice_session, admin_session, bob_session, bob_dog_id):
    """Part E: Admin RBAC tests"""
    print("\n" + "="*80)
    print("PART E — ADMIN RBAC")
    print("="*80)
    
    # Test 28: Alice GET /admin/stats -> 403
    print("\n[Test 28] Alice GET /admin/stats -> 403")
    try:
        resp = alice_session.get(f"{BASE_URL}/admin/stats")
        if resp.status_code == 403:
            log_test("Non-admin stats access", True, "Got 403 as expected")
        else:
            log_test("Non-admin stats access", False, f"Expected 403, got {resp.status_code}")
    except Exception as e:
        log_test("Non-admin stats access", False, str(e))
    
    # Test 29: Anon GET /admin/stats -> 401
    print("\n[Test 29] Anon GET /admin/stats -> 401")
    try:
        resp = httpx.get(f"{BASE_URL}/admin/stats", timeout=TIMEOUT_NORMAL)
        if resp.status_code == 401:
            log_test("Anon admin stats access", True, "Got 401 as expected")
        else:
            log_test("Anon admin stats access", False, f"Expected 401, got {resp.status_code}")
    except Exception as e:
        log_test("Anon admin stats access", False, str(e))
    
    # Test 30: Admin GET /admin/stats -> 200
    print("\n[Test 30] Admin GET /admin/stats -> 200")
    try:
        resp = admin_session.get(f"{BASE_URL}/admin/stats")
        data = resp.json()
        if resp.status_code == 200:
            required_fields = ["users", "dogs", "plans", "msgs", "mrr", "lifetimeRevenue", "premiumUsers"]
            has_all = all(field in data for field in required_fields)
            if has_all:
                log_test("Admin stats", True, f"Users: {data['users']}, Dogs: {data['dogs']}, Plans: {data['plans']}")
            else:
                log_test("Admin stats", False, f"Missing fields. Got: {list(data.keys())}")
        else:
            log_test("Admin stats", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Admin stats", False, str(e))
    
    # Test 31: Admin GET /admin/users
    print("\n[Test 31] Admin GET /admin/users")
    try:
        resp = admin_session.get(f"{BASE_URL}/admin/users")
        data = resp.json()
        if resp.status_code == 200 and isinstance(data, list):
            emails = [u.get("email") for u in data]
            has_alice = "alice@test.com" in emails
            has_bob = "bob@test.com" in emails
            has_admin = "admin@pawplan.ai" in emails
            if has_alice and has_bob and has_admin:
                log_test("Admin list users", True, f"Found {len(data)} users including alice, bob, admin")
                # Store bob's ID for deletion test
                bob_user = next((u for u in data if u.get("email") == "bob@test.com"), None)
                bob_user_id = bob_user.get("id") if bob_user else None
            else:
                log_test("Admin list users", False, f"Missing expected users. Emails: {emails}")
        else:
            log_test("Admin list users", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Admin list users", False, str(e))
    
    # Test 32: Admin GET /admin/dogs
    print("\n[Test 32] Admin GET /admin/dogs")
    try:
        resp = admin_session.get(f"{BASE_URL}/admin/dogs")
        data = resp.json()
        if resp.status_code == 200 and isinstance(data, list):
            dog_names = [d.get("name") for d in data]
            has_alfie = "Alfie" in dog_names
            has_buster = "Buster" in dog_names
            has_truffle = "Truffle" in dog_names
            if has_alfie and has_buster and has_truffle:
                log_test("Admin list dogs", True, f"Found {len(data)} dogs including Alfie, Buster, Truffle")
            else:
                log_test("Admin list dogs", False, f"Missing expected dogs. Names: {dog_names}")
        else:
            log_test("Admin list dogs", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Admin list dogs", False, str(e))
    
    # Test 33: Admin GET /admin/plans
    print("\n[Test 33] Admin GET /admin/plans")
    try:
        resp = admin_session.get(f"{BASE_URL}/admin/plans")
        data = resp.json()
        if resp.status_code == 200 and isinstance(data, list):
            log_test("Admin list plans", True, f"Found {len(data)} plans")
        else:
            log_test("Admin list plans", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Admin list plans", False, str(e))
    
    # Test 34: Admin GET /admin/transactions
    print("\n[Test 34] Admin GET /admin/transactions")
    try:
        resp = admin_session.get(f"{BASE_URL}/admin/transactions")
        data = resp.json()
        if resp.status_code == 200 and isinstance(data, list):
            # Should include Alice's transactions
            alice_txns = [t for t in data if "alice" in str(t).lower()]
            if len(data) >= 2:
                log_test("Admin list transactions", True, f"Found {len(data)} transactions")
            else:
                log_test("Admin list transactions", False, f"Expected at least 2 transactions, got {len(data)}")
        else:
            log_test("Admin list transactions", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Admin list transactions", False, str(e))
    
    # Test 35: Admin DELETE self -> 400
    print("\n[Test 35] Admin DELETE self -> 400")
    try:
        # Get admin's own ID
        resp = admin_session.get(f"{BASE_URL}/auth/me")
        admin_id = resp.json().get("user", {}).get("id")
        if admin_id:
            resp = admin_session.delete(f"{BASE_URL}/admin/users/{admin_id}")
            if resp.status_code == 400:
                log_test("Admin delete self", True, "Got 400 as expected")
            else:
                log_test("Admin delete self", False, f"Expected 400, got {resp.status_code}")
        else:
            log_test("Admin delete self", False, "Couldn't get admin ID")
    except Exception as e:
        log_test("Admin delete self", False, str(e))
    
    # Test 36: Admin DELETE Bob -> 200
    print("\n[Test 36] Admin DELETE Bob -> 200")
    try:
        # Get Bob's user ID from admin/users
        resp = admin_session.get(f"{BASE_URL}/admin/users")
        data = resp.json()
        bob_user = next((u for u in data if u.get("email") == "bob@test.com"), None)
        bob_user_id = bob_user.get("id") if bob_user else None
        
        if bob_user_id:
            resp = admin_session.delete(f"{BASE_URL}/admin/users/{bob_user_id}")
            if resp.status_code == 200:
                log_test("Admin delete Bob", True, "Bob deleted")
                
                # Verify Bob is gone from users list
                resp = admin_session.get(f"{BASE_URL}/admin/users")
                data = resp.json()
                emails = [u.get("email") for u in data]
                if "bob@test.com" not in emails:
                    log_test("Bob removed from users", True, "Bob no longer in users list")
                else:
                    log_test("Bob removed from users", False, "Bob still in users list")
                
                # Verify Buster is gone from dogs list
                resp = admin_session.get(f"{BASE_URL}/admin/dogs")
                data = resp.json()
                dog_names = [d.get("name") for d in data]
                if "Buster" not in dog_names:
                    log_test("Buster removed from dogs", True, "Buster no longer in dogs list")
                else:
                    log_test("Buster removed from dogs", False, "Buster still in dogs list")
            else:
                log_test("Admin delete Bob", False, f"Status: {resp.status_code}")
        else:
            log_test("Admin delete Bob", False, "Couldn't find Bob's user ID")
    except Exception as e:
        log_test("Admin delete Bob", False, str(e))

def test_regressions(alice_session):
    """Part F: Regressions tests"""
    print("\n" + "="*80)
    print("PART F — REGRESSIONS")
    print("="*80)
    
    # Test 37: Alice GET plans for demo-truffle
    print("\n[Test 37] Alice GET plans for demo-truffle")
    try:
        resp = alice_session.get(f"{BASE_URL}/plans?dogId=demo-truffle")
        data = resp.json()
        if resp.status_code == 200 and isinstance(data, list):
            if len(data) >= 1:
                log_test("Get plans for demo dog", True, f"Found {len(data)} plans")
            else:
                log_test("Get plans for demo dog", False, "No plans found")
        else:
            log_test("Get plans for demo dog", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Get plans for demo dog", False, str(e))
    
    # Test 38: Alice POST chat
    print("\n[Test 38] Alice POST chat")
    try:
        resp = alice_session.post(f"{BASE_URL}/chat", json={
            "dogId": "demo-truffle",
            "sessionId": "alice-test-1",
            "message": "Help with recall training"
        }, timeout=TIMEOUT_LLM)
        data = resp.json()
        if resp.status_code == 200 and "reply" in data:
            log_test("Chat endpoint", True, f"Got reply: {data['reply'][:50]}...")
        else:
            log_test("Chat endpoint", False, f"Status: {resp.status_code}, Response: {str(data)[:200]}")
    except Exception as e:
        log_test("Chat endpoint", False, str(e))
    
    # Test 39: Alice POST progress
    print("\n[Test 39] Alice POST progress")
    try:
        resp = alice_session.post(f"{BASE_URL}/progress", json={
            "dogId": "demo-truffle",
            "sessionType": "training",
            "durationMin": 15,
            "rating": 4,
            "notes": "good day"
        })
        data = resp.json()
        if resp.status_code == 200 and data.get("dogId") == "demo-truffle":
            log_test("Progress logging", True, "Progress entry created")
        else:
            log_test("Progress logging", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("Progress logging", False, str(e))

def main():
    print("="*80)
    print("PawPlan AI Phase 2 Backend Testing")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Timeout LLM: {TIMEOUT_LLM}s, Normal: {TIMEOUT_NORMAL}s")
    
    try:
        # Part A: Auth
        alice_session, admin_session = test_auth()
        
        # Part B: User Isolation
        bob_session, bob_dog_id = test_user_isolation(alice_session, admin_session)
        
        # Part C: Tier Limits
        test_tier_limits(alice_session)
        
        # Part D: Stripe Payments
        test_stripe_payments(alice_session)
        
        # Part E: Admin RBAC
        test_admin_rbac(alice_session, admin_session, bob_session, bob_dog_id)
        
        # Part F: Regressions
        test_regressions(alice_session)
        
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total: {passed + failed} tests")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    
    if failed > 0:
        print("\nFailed tests:")
        for result in test_results:
            if "❌" in result:
                print(f"  {result}")
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
