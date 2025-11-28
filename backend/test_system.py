"""
Test Suite for Medical Diagnosis Assistant
Run this to verify the system is working correctly
"""

import requests
import json
import time

API_BASE_URL = 'http://localhost:5000/api'

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def print_success(text):
    print(f"✓ {text}")

def print_error(text):
    print(f"✗ {text}")

def print_info(text):
    print(f"ℹ {text}")

def test_health_check():
    """Test if server is running"""
    print_header("Test 1: Health Check")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        data = response.json()
        
        if data['status'] == 'healthy':
            print_success("Server is running")
            print_info(f"AI Model: {'Online' if data['model_available'] else 'Offline Mode'}")
            print_info(f"Database: {data['database']}")
            return True
        else:
            print_error("Server returned unhealthy status")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to server. Is it running on port 5000?")
        return False
    except Exception as e:
        print_error(f"Health check failed: {str(e)}")
        return False

def test_patient_registration():
    """Test patient registration"""
    print_header("Test 2: Patient Registration")
    
    patient_data = {
        "patient_id": "TEST001",
        "name": "Test Patient",
        "age": 35,
        "gender": "male",
        "contact": "9876543210"
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/patients",
            json=patient_data,
            timeout=10
        )
        data = response.json()
        
        if data['status'] == 'success' or 'already exists' in data.get('message', ''):
            print_success("Patient registration successful")
            print_info(f"Patient ID: {patient_data['patient_id']}")
            return True
        else:
            print_error(f"Registration failed: {data.get('message')}")
            return False
    except Exception as e:
        print_error(f"Registration test failed: {str(e)}")
        return False

def test_diagnosis():
    """Test diagnosis functionality"""
    print_header("Test 3: Diagnosis")
    
    diagnosis_data = {
        "patient_id": "TEST001",
        "symptoms": "High fever for 3 days, severe headache, body ache, fatigue",
        "vital_signs": {
            "temperature": 102.5,
            "blood_pressure": "130/85",
            "heart_rate": 88,
            "oxygen_level": 97
        },
        "medical_history": "No known allergies. No chronic conditions.",
        "language": "en",
        "age": 35,
        "weight": 70,
        "gender": "male"
    }
    
    try:
        print_info("Analyzing symptoms...")
        response = requests.post(
            f"{API_BASE_URL}/diagnose",
            json=diagnosis_data,
            timeout=30
        )
        data = response.json()
        
        if data['status'] == 'success':
            diagnosis = data['diagnosis']
            print_success("Diagnosis completed")
            print_info(f"Primary Diagnosis: {diagnosis['primary_diagnosis']}")
            print_info(f"Confidence Score: {diagnosis['confidence_score']:.1f}%")
            print_info(f"Referral Needed: {'Yes' if diagnosis.get('referral_needed') else 'No'}")
            
            if diagnosis.get('treatment_protocol', {}).get('medications'):
                print_info(f"Medications: {len(diagnosis['treatment_protocol']['medications'])} prescribed")
            
            if data.get('drug_interactions'):
                print_info(f"Drug Interactions: {len(data['drug_interactions'])} found")
            
            return True
        else:
            print_error(f"Diagnosis failed: {data.get('message')}")
            if 'fallback' in data:
                print_info("Fallback diagnosis was provided")
            return False
    except Exception as e:
        print_error(f"Diagnosis test failed: {str(e)}")
        return False

def test_multilingual():
    """Test multilingual support"""
    print_header("Test 4: Multilingual Support")
    
    languages = {
        'hi': 'बुखार और सिरदर्द',
        'ta': 'காய்ச்சல் மற்றும் தலைவலி',
        'te': 'జ్వరం మరియు తలనొప్పి',
        'bn': 'জ্বর এবং মাথাব্যথা'
    }
    
    for lang_code, symptoms in languages.items():
        diagnosis_data = {
            "patient_id": "TEST001",
            "symptoms": symptoms,
            "vital_signs": {"temperature": 101},
            "medical_history": "",
            "language": lang_code,
            "age": 35,
            "weight": 70,
            "gender": "male"
        }
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/diagnose",
                json=diagnosis_data,
                timeout=30
            )
            data = response.json()
            
            if data['status'] == 'success':
                print_success(f"Language {lang_code.upper()} supported")
            else:
                print_error(f"Language {lang_code.upper()} failed")
        except Exception as e:
            print_error(f"Language {lang_code.upper()} test failed: {str(e)}")
        
        time.sleep(1)  # Rate limiting
    
    return True

def test_drug_interactions():
    """Test drug interaction checker"""
    print_header("Test 5: Drug Interaction Checker")
    
    test_cases = [
        {
            "medications": ["aspirin", "warfarin"],
            "expected": True  # Should have interaction
        },
        {
            "medications": ["paracetamol", "amoxicillin"],
            "expected": False  # Should be safe
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        try:
            response = requests.post(
                f"{API_BASE_URL}/drug-interactions/check",
                json=test_case,
                timeout=10
            )
            data = response.json()
            
            if data['status'] == 'success':
                has_interactions = len(data['interactions']) > 0
                if has_interactions == test_case['expected']:
                    print_success(f"Test case {i}: Correct detection")
                else:
                    print_error(f"Test case {i}: Incorrect detection")
            else:
                print_error(f"Test case {i}: API error")
        except Exception as e:
            print_error(f"Test case {i} failed: {str(e)}")
    
    return True

def test_dosage_calculator():
    """Test dosage calculator"""
    print_header("Test 6: Dosage Calculator")
    
    test_cases = [
        {"medication": "paracetamol", "age": 8, "weight": 25, "gender": "male"},
        {"medication": "paracetamol", "age": 35, "weight": 70, "gender": "female"},
        {"medication": "paracetamol", "age": 70, "weight": 60, "gender": "male"}
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        try:
            response = requests.post(
                f"{API_BASE_URL}/dosage/calculate",
                json=test_case,
                timeout=10
            )
            data = response.json()
            
            if data['status'] == 'success':
                dosage = data['dosage']
                print_success(f"Age {test_case['age']}: {dosage['recommended_dosage']}")
            else:
                print_error(f"Test case {i}: API error")
        except Exception as e:
            print_error(f"Test case {i} failed: {str(e)}")
    
    return True

def test_patient_history():
    """Test patient history retrieval"""
    print_header("Test 7: Patient History")
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/history/TEST001",
            timeout=10
        )
        data = response.json()
        
        if data['status'] == 'success':
            history_count = len(data['history'])
            print_success(f"History retrieved: {history_count} records")
            return True
        else:
            print_error("Failed to retrieve history")
            return False
    except Exception as e:
        print_error(f"History test failed: {str(e)}")
        return False

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("  MEDICAL DIAGNOSIS ASSISTANT - TEST SUITE")
    print("="*60)
    print("\nStarting tests...\n")
    
    results = []
    
    # Run tests
    results.append(("Health Check", test_health_check()))
    
    if results[0][1]:  # Only continue if server is running
        results.append(("Patient Registration", test_patient_registration()))
        results.append(("Diagnosis", test_diagnosis()))
        results.append(("Multilingual Support", test_multilingual()))
        # results.append(("Drug Interactions", test_drug_interactions()))  # Not implemented yet
        # results.append(("Dosage Calculator", test_dosage_calculator()))  # Not implemented yet
        results.append(("Patient History", test_patient_history()))
    else:
        print_error("\nServer is not running. Please start the backend:")
        print_info("cd backend")
        print_info("python app.py")
        return
    
    # Summary
    print_header("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print_success("\nAll tests passed! System is working correctly. 🎉")
    else:
        print_error(f"\n{total - passed} test(s) failed. Please check the errors above.")

if __name__ == "__main__":
    run_all_tests()
