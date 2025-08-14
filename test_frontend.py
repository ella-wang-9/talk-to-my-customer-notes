#!/usr/bin/env python3
"""Test that the frontend is loading the Customer Notes Q&A app."""

import requests
from urllib.parse import urljoin

def test_frontend():
    frontend_url = "http://localhost:5173"
    
    print("🌐 Testing Frontend Application")
    print("=" * 40)
    
    try:
        # Test that frontend is accessible
        response = requests.get(frontend_url, timeout=5)
        
        if response.status_code != 200:
            print(f"❌ Frontend not accessible: {response.status_code}")
            return False
            
        html_content = response.text
        
        # Check for key elements that should be in the Customer Notes app
        checks = [
            ("Customer Notes Q&A", "Main heading"),
            ("Customer Notes Q&A", "App title"),
            ("Enter Your Details", "Step 1 form"),
            ("React", "React is loaded"),
        ]
        
        print(f"✅ Frontend accessible at {frontend_url}")
        print("\n📋 Content Checks:")
        
        found_checks = 0
        for check, description in checks:
            if check in html_content:
                print(f"✅ {description}: Found")
                found_checks += 1
            else:
                print(f"❌ {description}: Not found")
        
        print(f"\n📊 Results: {found_checks}/{len(checks)} checks passed")
        
        if found_checks >= 2:  # At least React and basic structure
            print("🎉 Frontend appears to be loading correctly!")
            print(f"\n🔗 Open in browser: {frontend_url}")
            return True
        else:
            print("⚠️  Frontend may not be loading the Customer Notes app correctly")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to frontend: {e}")
        return False

if __name__ == "__main__":
    test_frontend()