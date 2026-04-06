import os
import requests
from dotenv import load_dotenv

# Explicitly load .env so keys are ALWAYS available regardless of launch context
load_dotenv(override=True)

def get_gemini_embedding(text: str) -> list[float]:
    """
    Calls the Google Gemini REST API to generate a vector embedding
    using gemini-embedding-001 model.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent"

    payload = {
        "model": "models/gemini-embedding-001",
        "content": {
            "parts": [{
                "text": text
            }]
        }
    }

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key        # Use header auth, NOT query param
    }

    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()

    data = response.json()
    return data.get("embedding", {}).get("values", [])

def generate_groq_completion(prompt: str, system_prompt: str = "You are Aegis, a Police Intelligence Assistant.") -> str:
    """
    Calls the Groq REST API using Meta-Llama llama-3.3-70b-versatile.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set.")

    url = "https://api.groq.com/openai/v1/chat/completions"

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 1,
        "max_completion_tokens": 1024,
        "top_p": 1,
        "stream": False,  # Keep False for simple JSON response
        "stop": None
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()

    data = response.json()
    return data["choices"][0]["message"]["content"]
