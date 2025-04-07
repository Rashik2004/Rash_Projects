import os
import sys
import google.generativeai as genai
from config import Config

def test_gemini_api():
    """Test if the Gemini API key is working properly"""
    print("Testing Gemini API connection...")

    # Get API key from config
    api_key = Config.GEMINI_API_KEY
    model_name = Config.AI_MODEL

    if not api_key:
        print("❌ No Gemini API key found in config.py")
        print("Get a free API key at: https://aistudio.google.com/app/apikey")
        return False

    try:
        # Configure with your API key
        genai.configure(api_key=api_key)

        # Test available models
        print("📋 Available models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f" - {m.name}")

        # Create a model with the model name from config
        print(f"\n🔍 Using model: {model_name}")
        model = genai.GenerativeModel(model_name)

        # Generate text
        print("\n🚀 Testing API with simple query...")
        response = model.generate_content("Say hello world")

        if response:
            print(f"✅ API key is working! Response: {response.text}")
            return True
        else:
            print("❌ API call succeeded but returned an empty response")
            return False

    except Exception as e:
        print(f"❌ API call failed: {str(e)}")

        # Check for common errors
        error_str = str(e).lower()
        if "api key" in error_str or "key" in error_str or "unauthorized" in error_str:
            print("The API key appears to be invalid or incorrectly formatted.")
            print("Get a free key at: https://aistudio.google.com/app/apikey")
        elif "rate" in error_str or "limit" in error_str:
            print("You've hit a rate limit. Try again later.")
        elif "region" in error_str:
            print("There may be region restrictions for your API key.")

        return False

if __name__ == "__main__":
    test_gemini_api()
