#!/usr/bin/env python3
import os
import sys
import openai
from config import Config

def test_openai_api():
    """Test if the OpenAI API key is working properly"""
    print("Testing OpenAI API connection...")

    # Get API key from config
    api_key = Config.OPENAI_API_KEY

    if not api_key:
        print("❌ No API key found in config.py")
        return False

    # Set the API key
    openai.api_key = api_key

    try:
        # Make a simple API call
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say hello world"}
            ],
            max_tokens=10
        )

        # Check if we got a valid response
        if response and response.choices and len(response.choices) > 0:
            print(f"✅ API key is working! Response: {response.choices[0].message.content}")
            return True
        else:
            print("❌ API call succeeded but returned an unexpected format")
            print(f"Response: {response}")
            return False

    except Exception as e:
        print(f"❌ API call failed: {str(e)}")

        # Check for common errors
        if "authentication" in str(e).lower() or "key" in str(e).lower() or "unauthorized" in str(e).lower():
            print("The API key appears to be invalid or expired.")
            print("Get a new key at: https://platform.openai.com/api-keys")
        elif "rate" in str(e).lower() or "limit" in str(e).lower():
            print("You've hit a rate limit. Try again later.")
        elif "quota" in str(e).lower() or "credit" in str(e).lower():
            print("You've run out of API quota/credits.")
            print("Check your usage at: https://platform.openai.com/usage")

        return False

if __name__ == "__main__":
    test_openai_api()
