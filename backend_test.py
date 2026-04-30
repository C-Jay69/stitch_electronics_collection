#!/usr/bin/env python3
"""
PawPlan AI Backend API Test Suite
Tests all backend endpoints in the correct order with proper timeouts for LLM calls.
"""
import httpx
import json
import time
from typing import Dict, Any

# Base URLs
BASE_URL = "https://pawplan-main.preview.emergentagent.com/api"
LOCAL_URL = "http://localhost:3000/api"

# Use production URL
API_BASE = BASE_URL

# Timeouts
STANDARD_TIMEOUT = 30.0
LLM_TIMEOUT = 120.0  # For plan generation, chat, and adjust endpoints

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def log_test(name: str, passed: bool, details: str = ""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {name}")
    if details:
        print(f"  Details: {details}")
    
    test_results["tests"].append({
        "name": name,
        "passed": passed,
        "details": details
    })
    if passed:
        test_results["passed"] += 1
    else:
        test_results["failed"] += 1

def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total: {test_results['passed'] + test_results['failed']}")
    print(f"Passed: {test_results['passed']}")
    print(f"Failed: {test_results['failed']}")
    print("="*80)
    
    if test_results["failed"] > 0:
        print("\nFailed Tests:")
        for test in test_results["tests"]:
            if not test["passed"]:
                print(f"  ❌ {test['name']}")
                if test["details"]:
                    print(f"     {test['details']}")

def test_health():
    """Test 1: Health check endpoint"""
    print("\n" + "="*80)
    print("TEST 1: Health Check - GET /api/")
    print("="*80)
    
    try:
        with httpx.Client(timeout=STANDARD_TIMEOUT, follow_redirects=True) as client:
            response = client.get(f"{API_BASE}")
            
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") == True and data.get("app") == "PawPlan AI":
                    log_test("Health check", True, "API is healthy")
                    return True
                else:
                    log_test("Health check", False, f"Unexpected response: {data}")
                    return False
            else:
                log_test("Health check", False, f"Status {response.status_code}: {response.text}")
                return False
    except Exception as e:
        log_test("Health check", False, f"Exception: {str(e)}")
        return False

def test_seed():
    """Test 2: Seed demo dog"""
    print("\n" + "="*80)
    print("TEST 2: Seed Demo Dog - POST /api/seed")
    print("="*80)
    
    try:
        with httpx.Client(timeout=STANDARD_TIMEOUT) as client:
            response = client.post(f"{API_BASE}/seed")
            
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            
            if response.status_code == 200:
                data = response.json()
                dog = data.get("dog", {})
                
                if dog.get("id") == "demo-truffle" and dog.get("name") == "Truffle":
                    log_test("Seed demo dog", True, f"Truffle created: {dog.get('breed')}, {dog.get('weightKg')}kg")
                    return dog
                else:
                    log_test("Seed demo dog", False, f"Unexpected dog data: {dog}")
                    return None
            else:
                log_test("Seed demo dog", False, f"Status {response.status_code}: {response.text}")
                return None
    except Exception as e:
        log_test("Seed demo dog", False, f"Exception: {str(e)}")
        return None

def test_dogs_crud():
    """Test 3: Dogs CRUD operations"""
    print("\n" + "="*80)
    print("TEST 3: Dogs CRUD Operations")
    print("="*80)
    
    rex_id = None
    
    # 3a. Create dog (POST)
    print("\n3a. POST /api/dogs - Create Rex")
    try:
        with httpx.Client(timeout=STANDARD_TIMEOUT) as client:
            dog_data = {
                "name": "Rex",
                "breed": "Border Collie",
                "ageYears": 3,
                "weightKg": 18,
                "activityLevel": "high",
                "allergies": ["beef"],
                "behaviorIssues": ["barking"],
                "goals": ["agility"]
            }
            response = client.post(f"{API_BASE}/dogs", json=dog_data)
            
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            
            if response.status_code == 200:
                rex = response.json()
                rex_id = rex.get("id")
                if rex_id and rex.get("name") == "Rex":
                    log_test("Create dog (POST)", True, f"Rex created with id: {rex_id}")
                else:
                    log_test("Create dog (POST)", False, f"Missing id or name: {rex}")
                    return False
            else:
                log_test("Create dog (POST)", False, f"Status {response.status_code}: {response.text}")
                return False
    except Exception as e:
        log_test("Create dog (POST)", False, f"Exception: {str(e)}")
        return False
    
    # 3b. List dogs (GET)
    print("\n3b. GET /api/dogs - List all dogs")
    try:
        with httpx.Client(timeout=STANDARD_TIMEOUT) as client:
            response = client.get(f"{API_BASE}/dogs")
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                dogs = response.json()
                print(f"Found {len(dogs)} dogs")
                
                has_truffle = any(d.get("id") == "demo-truffle" for d in dogs)
                has_rex = any(d.get("id") == rex_id for d in dogs)
                
                if has_truffle and has_rex:
                    log_test("List dogs (GET)", True, f"Found both Truffle and Rex in list of {len(dogs)} dogs")
                else:
                    log_test("List dogs (GET)", False, f"Missing dogs - Truffle: {has_truffle}, Rex: {has_rex}")
                    return False
            else:
                log_test("List dogs (GET)", False, f"Status {response.status_code}: {response.text}")
                return False
    except Exception as e:
        log_test("List dogs (GET)", False, f"Exception: {str(e)}")
        return False
    
    # 3c. Get single dog (GET)
    print(f"\n3c. GET /api/dogs/{rex_id} - Get Rex by ID")
    try:
        with httpx.Client(timeout=STANDARD_TIMEOUT) as client:
            response = client.get(f"{API_BASE}/dogs/{rex_id}")
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                rex = response.json()
                if rex.get("id") == rex_id and rex.get("name") == "Rex":
                    log_test("Get dog by ID (GET)", True, f"Retrieved Rex: {rex.get('breed')}")
                else:
                    log_test("Get dog by ID (GET)", False, f"Wrong dog data: {rex}")
                    return False
            else:
                log_test("Get dog by ID (GET)", False, f"Status {response.status_code}: {response.text}")
                return False
    except Exception as e:
        log_test("Get dog by ID (GET)", False, f"Exception: {str(e)}")
        return False
    
    # 3d. Update dog (PUT)
    print(f"\n3d. PUT /api/dogs/{rex_id} - Update Rex's weight")
    try:
        with httpx.Client(timeout=STANDARD_TIMEOUT) as client:
            response = client.put(f"{API_BASE}/dogs/{rex_id}", json={"weightKg": 19})
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                rex = response.json()
                if rex.get("weightKg") == 19:
                    log_test("Update dog (PUT)", True, f"Rex weight updated to 19kg")
                else:
                    log_test("Update dog (PUT)", False, f"Weight not updated: {rex.get('weightKg')}")
                    return False
            else:
                log_test("Update dog (PUT)", False, f"Status {response.status_code}: {response.text}")
                return False
    except Exception as e:
        log_test("Update dog (PUT)", False, f"Exception: {str(e)}")
        return False
    
    # 3e. Delete dog (DELETE)
    print(f"\n3e. DELETE /api/dogs/{rex_id} - Delete Rex")
    try:
        with httpx.Client(timeout=STANDARD_TIMEOUT) as client:
            response = client.delete(f"{API_BASE}/dogs/{rex_id}")
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") == True:
                    log_test("Delete dog (DELETE)", True, "Rex deleted successfully")
                    return True
                else:
                    log_test("Delete dog (DELETE)", False, f"Unexpected response: {data}")
                    return False
            else:
                log_test("Delete dog (DELETE)", False, f"Status {response.status_code}: {response.text}")
                return False
    except Exception as e:
        log_test("Delete dog (DELETE)", False, f"Exception: {str(e)}")
        return False

def test_plan_generation():
    """Test 4: Plan generation with LLM"""
    print("\n" + "="*80)
    print("TEST 4: Plan Generation - POST /api/plans/generate")
    print("="*80)
    print("⏱️  This may take up to 120 seconds (LLM call)...")
    
    try:
        with httpx.Client(timeout=LLM_TIMEOUT) as client:
            plan_request = {
                "dogId": "demo-truffle",
                "planType": "combined"
            }
            
            start_time = time.time()
            response = client.post(f"{API_BASE}/plans/generate", json=plan_request)
            elapsed = time.time() - start_time
            
            print(f"Status: {response.status_code}")
            print(f"Time taken: {elapsed:.1f}s")
            
            if response.status_code == 200:
                data = response.json()
                plan_id = data.get("id")
                dog_id = data.get("dogId")
                plan = data.get("plan", {})
                
                print(f"Plan ID: {plan_id}")
                print(f"Plan Title: {plan.get('title')}")
                print(f"Plan Summary: {plan.get('summary', '')[:200]}...")
                
                # Validate structure
                has_id = bool(plan_id)
                has_dog_id = dog_id == "demo-truffle"
                has_title = bool(plan.get("title"))
                has_summary = bool(plan.get("summary"))
                has_training = "training" in plan and plan["training"] is not None
                has_nutrition = "nutrition" in plan and plan["nutrition"] is not None
                has_shopping = bool(plan.get("shoppingList"))
                has_milestones = bool(plan.get("milestones"))
                
                # Check personalization (mentions Truffle or labrador)
                summary_lower = plan.get("summary", "").lower()
                is_personalized = "truffle" in summary_lower or "labrador" in summary_lower or "lab" in summary_lower
                
                # Check nutrition avoids chicken (Truffle's allergy)
                nutrition = plan.get("nutrition", {})
                avoid_list = nutrition.get("avoid", [])
                avoid_text = " ".join(avoid_list).lower()
                chicken_avoided = "chicken" in avoid_text
                
                print(f"\nValidation:")
                print(f"  ✓ Has ID: {has_id}")
                print(f"  ✓ Has dogId: {has_dog_id}")
                print(f"  ✓ Has title: {has_title}")
                print(f"  ✓ Has summary: {has_summary}")
                print(f"  ✓ Has training: {has_training}")
                print(f"  ✓ Has nutrition: {has_nutrition}")
                print(f"  ✓ Has shopping list: {has_shopping}")
                print(f"  ✓ Has milestones: {has_milestones}")
                print(f"  ✓ Is personalized: {is_personalized}")
                print(f"  ✓ Chicken avoided: {chicken_avoided}")
                
                if has_training:
                    training = plan.get("training", {})
                    phases = training.get("phases", [])
                    print(f"  ✓ Training phases: {len(phases)}")
                
                if has_nutrition:
                    meals = nutrition.get("meals", [])
                    daily_cal = nutrition.get("dailyCalories", 0)
                    print(f"  ✓ Meals: {len(meals)}")
                    print(f"  ✓ Daily calories: {daily_cal}")
                
                all_valid = (has_id and has_dog_id and has_title and has_summary and 
                           has_training and has_nutrition and has_shopping and 
                           has_milestones and is_personalized)
                
                if all_valid:
                    if not chicken_avoided:
                        log_test("Plan generation", True, f"Plan generated successfully (Minor: chicken not in avoid list)")
                    else:
                        log_test("Plan generation", True, f"Plan generated with all required fields and personalization")
                    return plan_id
                else:
                    log_test("Plan generation", False, f"Missing required fields or not personalized")
                    return None
            else:
                log_test("Plan generation", False, f"Status {response.status_code}: {response.text[:500]}")
                return None
    except httpx.TimeoutException:
        log_test("Plan generation", False, "Request timed out after 120s")
        return None
    except Exception as e:
        log_test("Plan generation", False, f"Exception: {str(e)}")
        return None

def test_plans_list_get(plan_id: str):
    """Test 5: List and get plans"""
    print("\n" + "="*80)
    print("TEST 5: List and Get Plans")
    print("="*80)
    
    # 5a. List plans for dog
    print("\n5a. GET /api/plans?dogId=demo-truffle")
    try:
        with httpx.Client(timeout=STANDARD_TIMEOUT) as client:
            response = client.get(f"{API_BASE}/plans?dogId=demo-truffle")
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                plans = response.json()
                print(f"Found {len(plans)} plans")
                
                has_plan = any(p.get("id") == plan_id for p in plans)
                
                if has_plan:
                    log_test("List plans (GET)", True, f"Found plan {plan_id} in list of {len(plans)} plans")
                else:
                    log_test("List plans (GET)", False, f"Plan {plan_id} not found in list")
                    return False
            else:
                log_test("List plans (GET)", False, f"Status {response.status_code}: {response.text}")
                return False
    except Exception as e:
        log_test("List plans (GET)", False, f"Exception: {str(e)}")
        return False
    
    # 5b. Get single plan
    print(f"\n5b. GET /api/plans/{plan_id}")
    try:
        with httpx.Client(timeout=STANDARD_TIMEOUT) as client:
            response = client.get(f"{API_BASE}/plans/{plan_id}")
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                plan_data = response.json()
                if plan_data.get("id") == plan_id:
                    log_test("Get plan by ID (GET)", True, f"Retrieved plan: {plan_data.get('plan', {}).get('title')}")
                    return True
                else:
                    log_test("Get plan by ID (GET)", False, f"Wrong plan data")
                    return False
            else:
                log_test("Get plan by ID (GET)", False, f"Status {response.status_code}: {response.text}")
                return False
    except Exception as e:
        log_test("Get plan by ID (GET)", False, f"Exception: {str(e)}")
        return False

def test_chat_with_memory():
    """Test 6: Chat with memory"""
    print("\n" + "="*80)
    print("TEST 6: Chat with Memory - POST /api/chat")
    print("="*80)
    
    session_id = "test-session-A"
    
    # 6a. First message
    print("\n6a. First chat message (leash pulling)")
    print("⏱️  This may take up to 120 seconds (LLM call)...")
    
    try:
        with httpx.Client(timeout=LLM_TIMEOUT) as client:
            chat_request = {
                "dogId": "demo-truffle",
                "sessionId": session_id,
                "message": "Truffle pulls hard on the leash. What can I do?"
            }
            
            start_time = time.time()
            response = client.post(f"{API_BASE}/chat", json=chat_request)
            elapsed = time.time() - start_time
            
            print(f"Status: {response.status_code}")
            print(f"Time taken: {elapsed:.1f}s")
            
            if response.status_code == 200:
                data = response.json()
                reply = data.get("reply", "")
                message = data.get("message", {})
                
                print(f"Reply preview: {reply[:200]}...")
                
                if reply and message:
                    log_test("Chat first message", True, f"Got reply ({len(reply)} chars)")
                else:
                    log_test("Chat first message", False, "Missing reply or message")
                    return False
            else:
                log_test("Chat first message", False, f"Status {response.status_code}: {response.text[:500]}")
                return False
    except httpx.TimeoutException:
        log_test("Chat first message", False, "Request timed out after 120s")
        return False
    except Exception as e:
        log_test("Chat first message", False, f"Exception: {str(e)}")
        return False
    
    # 6b. Second message (test memory)
    print("\n6b. Second chat message (test memory)")
    print("⏱️  This may take up to 120 seconds (LLM call)...")
    
    try:
        with httpx.Client(timeout=LLM_TIMEOUT) as client:
            chat_request = {
                "dogId": "demo-truffle",
                "sessionId": session_id,
                "message": "What was my previous question about?"
            }
            
            start_time = time.time()
            response = client.post(f"{API_BASE}/chat", json=chat_request)
            elapsed = time.time() - start_time
            
            print(f"Status: {response.status_code}")
            print(f"Time taken: {elapsed:.1f}s")
            
            if response.status_code == 200:
                data = response.json()
                reply = data.get("reply", "")
                
                print(f"Reply preview: {reply[:300]}...")
                
                # Check if reply references leash/pulling
                reply_lower = reply.lower()
                has_memory = "leash" in reply_lower or "pull" in reply_lower
                
                if reply and has_memory:
                    log_test("Chat memory test", True, f"Reply references previous question about leash pulling")
                else:
                    log_test("Chat memory test", False, f"Reply doesn't reference leash/pulling (memory issue)")
                    return False
            else:
                log_test("Chat memory test", False, f"Status {response.status_code}: {response.text[:500]}")
                return False
    except httpx.TimeoutException:
        log_test("Chat memory test", False, "Request timed out after 120s")
        return False
    except Exception as e:
        log_test("Chat memory test", False, f"Exception: {str(e)}")
        return False
    
    # 6c. Get chat history
    print(f"\n6c. GET /api/chat/{session_id} - Get chat history")
    try:
        with httpx.Client(timeout=STANDARD_TIMEOUT) as client:
            response = client.get(f"{API_BASE}/chat/{session_id}")
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                messages = response.json()
                print(f"Found {len(messages)} messages")
                
                # Should have 4 messages (2 user + 2 assistant)
                user_msgs = [m for m in messages if m.get("role") == "user"]
                assistant_msgs = [m for m in messages if m.get("role") == "assistant"]
                
                print(f"  User messages: {len(user_msgs)}")
                print(f"  Assistant messages: {len(assistant_msgs)}")
                
                if len(messages) == 4 and len(user_msgs) == 2 and len(assistant_msgs) == 2:
                    log_test("Get chat history", True, f"Found 4 messages (2 user + 2 assistant)")
                    return True
                else:
                    log_test("Get chat history", False, f"Expected 4 messages, got {len(messages)}")
                    return False
            else:
                log_test("Get chat history", False, f"Status {response.status_code}: {response.text}")
                return False
    except Exception as e:
        log_test("Get chat history", False, f"Exception: {str(e)}")
        return False

def test_progress():
    """Test 7: Progress logging"""
    print("\n" + "="*80)
    print("TEST 7: Progress Logging - POST/GET /api/progress")
    print("="*80)
    
    # 7a. Create progress entry
    print("\n7a. POST /api/progress - Log training session")
    try:
        with httpx.Client(timeout=STANDARD_TIMEOUT) as client:
            progress_data = {
                "dogId": "demo-truffle",
                "sessionType": "training",
                "durationMin": 20,
                "weightKg": 27.8,
                "rating": 4,
                "notes": "Great recall practice"
            }
            
            response = client.post(f"{API_BASE}/progress", json=progress_data)
            
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:300]}")
            
            if response.status_code == 200:
                entry = response.json()
                entry_id = entry.get("id")
                
                if entry_id and entry.get("dogId") == "demo-truffle":
                    log_test("Create progress entry", True, f"Progress logged with id: {entry_id}")
                else:
                    log_test("Create progress entry", False, f"Missing id or dogId")
                    return False
            else:
                log_test("Create progress entry", False, f"Status {response.status_code}: {response.text}")
                return False
    except Exception as e:
        log_test("Create progress entry", False, f"Exception: {str(e)}")
        return False
    
    # 7b. Get progress entries
    print("\n7b. GET /api/progress?dogId=demo-truffle")
    try:
        with httpx.Client(timeout=STANDARD_TIMEOUT) as client:
            response = client.get(f"{API_BASE}/progress?dogId=demo-truffle")
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                entries = response.json()
                print(f"Found {len(entries)} progress entries")
                
                # Check if our entry is there
                has_entry = any(e.get("notes") == "Great recall practice" for e in entries)
                
                if has_entry:
                    log_test("Get progress entries", True, f"Found progress entry in list of {len(entries)} entries")
                    return True
                else:
                    log_test("Get progress entries", False, "Progress entry not found")
                    return False
            else:
                log_test("Get progress entries", False, f"Status {response.status_code}: {response.text}")
                return False
    except Exception as e:
        log_test("Get progress entries", False, f"Exception: {str(e)}")
        return False

def test_plan_adjust():
    """Test 8: Plan adjustment with feedback"""
    print("\n" + "="*80)
    print("TEST 8: Plan Adjustment - POST /api/plans/adjust")
    print("="*80)
    print("⏱️  This may take up to 120 seconds (LLM call)...")
    
    try:
        with httpx.Client(timeout=LLM_TIMEOUT) as client:
            adjust_request = {
                "dogId": "demo-truffle",
                "feedback": "Truffle did really well with watch-me. Please make morning meal portions ~10% smaller."
            }
            
            start_time = time.time()
            response = client.post(f"{API_BASE}/plans/adjust", json=adjust_request)
            elapsed = time.time() - start_time
            
            print(f"Status: {response.status_code}")
            print(f"Time taken: {elapsed:.1f}s")
            
            if response.status_code == 200:
                data = response.json()
                plan_id = data.get("id")
                plan = data.get("plan", {})
                
                print(f"Adjusted Plan ID: {plan_id}")
                print(f"Plan Title: {plan.get('title')}")
                
                if plan_id and plan.get("title"):
                    log_test("Plan adjustment", True, f"Plan adjusted successfully: {plan.get('title')}")
                    return True
                else:
                    log_test("Plan adjustment", False, "Missing plan data")
                    return False
            else:
                log_test("Plan adjustment", False, f"Status {response.status_code}: {response.text[:500]}")
                return False
    except httpx.TimeoutException:
        log_test("Plan adjustment", False, "Request timed out after 120s")
        return False
    except Exception as e:
        log_test("Plan adjustment", False, f"Exception: {str(e)}")
        return False

def main():
    """Run all tests in sequence"""
    print("\n" + "="*80)
    print("PAWPLAN AI BACKEND API TEST SUITE")
    print("="*80)
    print(f"API Base URL: {API_BASE}")
    print(f"Standard Timeout: {STANDARD_TIMEOUT}s")
    print(f"LLM Timeout: {LLM_TIMEOUT}s")
    
    # Test 1: Health
    if not test_health():
        print("\n⚠️  Health check failed. Stopping tests.")
        print_summary()
        return
    
    # Test 2: Seed
    demo_dog = test_seed()
    if not demo_dog:
        print("\n⚠️  Seed failed. Continuing with other tests...")
    
    # Test 3: Dogs CRUD
    test_dogs_crud()
    
    # Test 4: Plan generation
    plan_id = test_plan_generation()
    
    # Test 5: List/get plans
    if plan_id:
        test_plans_list_get(plan_id)
    else:
        print("\n⚠️  Skipping plan list/get tests (no plan ID)")
    
    # Test 6: Chat with memory
    test_chat_with_memory()
    
    # Test 7: Progress
    test_progress()
    
    # Test 8: Plan adjust
    test_plan_adjust()
    
    # Print summary
    print_summary()

if __name__ == "__main__":
    main()
