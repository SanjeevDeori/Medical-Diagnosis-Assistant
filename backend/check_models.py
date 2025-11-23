import google.generativeai as genai
import os

# Configure Gemini API Key
api_key = 'your_api_key_here'
if not api_key:
    print("No API key found")
else:
    genai.configure(api_key=api_key)
    print("Listing available models:")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
    except Exception as e:
        print(f"Error listing models: {e}")
