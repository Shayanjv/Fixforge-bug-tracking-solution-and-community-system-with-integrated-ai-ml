import google.generativeai as genai
import time

GEMINI_API_KEY = "AIzaSyCP2AXzpyIbplNtcwuEffER4rMp5cYLCL8"

print("🔵 Configuring Gemini API...")
genai.configure(api_key=GEMINI_API_KEY)

print("⏳ Waiting 10 seconds to avoid rate limits...\n")
time.sleep(10)

# ✅ Use the CORRECT model name from your list
model = genai.GenerativeModel('models/gemini-2.5-flash')

print("🤖 Testing Gemini 2.5 Flash...\n")

response = model.generate_content("Say hello in a friendly way!")

print("✅ Response from Gemini:")
print("-" * 60)
print(response.text)
print("-" * 60)

print("\n✅ SUCCESS! Gemini 2.5 Flash is working perfectly!")
print("💡 You can now use this in your FixForge backend!")
