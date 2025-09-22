import requests
import sys
import json
from datetime import datetime
import time

class PythonTestPlatformTester:
    def __init__(self, base_url="https://codetest.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.session_id = None
        self.result_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Add authorization header if needed
        if use_admin and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
            
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list) and len(response_data) > 0:
                        print(f"   Response: List with {len(response_data)} items")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_init_data(self):
        """Initialize sample data"""
        print("\n" + "="*50)
        print("INITIALIZING SAMPLE DATA")
        print("="*50)
        
        success, response = self.run_test(
            "Initialize Sample Data",
            "POST",
            "init-data",
            200
        )
        return success

    def test_register_user(self):
        """Test user registration"""
        print("\n" + "="*50)
        print("TESTING USER REGISTRATION")
        print("="*50)
        
        timestamp = int(time.time())
        test_user_data = {
            "email": f"test_user_{timestamp}@test.az",
            "password": "TestPass123!",
            "full_name": f"Test User {timestamp}",
            "bio": "Test user for platform testing"
        }
        
        success, response = self.run_test(
            "Register New User",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_admin_login(self):
        """Test admin login"""
        print("\n" + "="*50)
        print("TESTING ADMIN LOGIN")
        print("="*50)
        
        admin_data = {
            "email": "admin@pythontest.az",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin logged in successfully")
            return True
        return False

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION ENDPOINTS")
        print("="*50)
        
        # Test get current user
        success1, _ = self.run_test(
            "Get Current User Profile",
            "GET",
            "auth/me",
            200
        )
        
        return success1

    def test_test_system(self):
        """Test the complete test system flow"""
        print("\n" + "="*50)
        print("TESTING TEST SYSTEM")
        print("="*50)
        
        # Start a test
        success1, response1 = self.run_test(
            "Start Test",
            "POST",
            "tests/start",
            200
        )
        
        if not success1 or 'session_id' not in response1:
            return False
            
        self.session_id = response1['session_id']
        total_questions = response1['total_questions']
        print(f"   Session ID: {self.session_id}")
        print(f"   Total Questions: {total_questions}")
        
        # Answer all questions
        for i in range(total_questions):
            # Get question
            success2, response2 = self.run_test(
                f"Get Question {i+1}",
                "GET",
                f"tests/{self.session_id}/question/{i}",
                200
            )
            
            if not success2:
                return False
                
            question_id = response2['question']['id']
            
            # Submit answer (always select option 0 for testing)
            answer_data = {
                "question_id": question_id,
                "selected_option": 0
            }
            
            success3, _ = self.run_test(
                f"Submit Answer {i+1}",
                "POST",
                f"tests/{self.session_id}/answer",
                200,
                data=answer_data
            )
            
            if not success3:
                return False
        
        # Complete test
        success4, response4 = self.run_test(
            "Complete Test",
            "POST",
            f"tests/{self.session_id}/complete",
            200
        )
        
        if success4 and 'result_id' in response4:
            self.result_id = response4['result_id']
            print(f"   Result ID: {self.result_id}")
            print(f"   Score: {response4['score']}/{response4['total_questions']}")
            print(f"   Percentage: {response4['percentage']:.1f}%")
            return True
            
        return False

    def test_leaderboard(self):
        """Test leaderboard endpoint"""
        print("\n" + "="*50)
        print("TESTING LEADERBOARD")
        print("="*50)
        
        success, response = self.run_test(
            "Get Leaderboard",
            "GET",
            "leaderboard",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} users on leaderboard")
            return True
        return False

    def test_user_profile(self):
        """Test user profile endpoints"""
        print("\n" + "="*50)
        print("TESTING USER PROFILE")
        print("="*50)
        
        if not self.user_id:
            print("❌ No user ID available for profile testing")
            return False
            
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            f"users/{self.user_id}/profile",
            200
        )
        
        if success and 'user' in response:
            print(f"   Profile loaded for: {response['user']['full_name']}")
            return True
        return False

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        print("\n" + "="*50)
        print("TESTING ADMIN ENDPOINTS")
        print("="*50)
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        # Test admin stats
        success1, response1 = self.run_test(
            "Get Admin Stats",
            "GET",
            "admin/stats",
            200,
            use_admin=True
        )
        
        # Test get all users
        success2, response2 = self.run_test(
            "Get All Users",
            "GET",
            "admin/users",
            200,
            use_admin=True
        )
        
        # Test get all questions
        success3, response3 = self.run_test(
            "Get All Questions",
            "GET",
            "admin/questions",
            200,
            use_admin=True
        )
        
        # Test create question
        new_question = {
            "category": "Python Sintaksisi",
            "question_text": "Test sualı - Python-da print funksiyası necə istifadə olunur?",
            "options": ["print()", "console.log()", "echo", "write()"],
            "correct_answer": 0,
            "explanation": "Python-da print() funksiyası istifadə olunur."
        }
        
        success4, response4 = self.run_test(
            "Create New Question",
            "POST",
            "admin/questions",
            200,
            data=new_question,
            use_admin=True
        )
        
        question_id = None
        if success4 and 'id' in response4:
            question_id = response4['id']
            
            # Test delete question
            success5, _ = self.run_test(
                "Delete Question",
                "DELETE",
                f"admin/questions/{question_id}",
                200,
                use_admin=True
            )
        else:
            success5 = False
        
        return all([success1, success2, success3, success4, success5])

    def test_error_scenarios(self):
        """Test error scenarios"""
        print("\n" + "="*50)
        print("TESTING ERROR SCENARIOS")
        print("="*50)
        
        # Test invalid login
        success1, _ = self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@test.az", "password": "wrongpass"}
        )
        
        # Test duplicate registration
        success2, _ = self.run_test(
            "Duplicate Registration",
            "POST",
            "auth/register",
            400,
            data={
                "email": "admin@pythontest.az",  # Admin email already exists
                "password": "test123",
                "full_name": "Test User"
            }
        )
        
        # Test unauthorized access to admin endpoint
        temp_token = self.token
        self.token = None  # Remove token
        success3, _ = self.run_test(
            "Unauthorized Admin Access",
            "GET",
            "admin/stats",
            401
        )
        self.token = temp_token  # Restore token
        
        # Test non-admin access to admin endpoint
        success4, _ = self.run_test(
            "Non-Admin Access to Admin Endpoint",
            "GET",
            "admin/stats",
            403
        )
        
        return all([success1, success2, success3, success4])

def main():
    print("🚀 Starting Python Test Platform Backend Testing")
    print("=" * 60)
    
    tester = PythonTestPlatformTester()
    
    # Run all tests in sequence
    test_results = []
    
    # Initialize data first
    test_results.append(("Initialize Data", tester.test_init_data()))
    
    # Test user registration and authentication
    test_results.append(("User Registration", tester.test_register_user()))
    test_results.append(("Admin Login", tester.test_admin_login()))
    test_results.append(("Authentication Endpoints", tester.test_auth_endpoints()))
    
    # Test main functionality
    test_results.append(("Test System", tester.test_test_system()))
    test_results.append(("Leaderboard", tester.test_leaderboard()))
    test_results.append(("User Profile", tester.test_user_profile()))
    test_results.append(("Admin Endpoints", tester.test_admin_endpoints()))
    
    # Test error scenarios
    test_results.append(("Error Scenarios", tester.test_error_scenarios()))
    
    # Print final results
    print("\n" + "="*60)
    print("FINAL TEST RESULTS")
    print("="*60)
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<25} {status}")
    
    print(f"\n📊 Overall Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    failed_tests = [name for name, result in test_results if not result]
    if failed_tests:
        print(f"\n❌ Failed Tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("\n🎉 All backend tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())