import os
import requests

def get_gemini_embedding(text: str) -> list[float]:
    """
    Calls the Google Gemini REST API to generate a vector embedding
    for the provided text (suspect descriptions, MOs, etc.)
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}"
    
    payload = {
        "model": "models/text-embedding-004",
        "content": {
            "parts": [{
                "text": text
            }]
        }
    }
    
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    
    data = response.json()
    return data.get("embedding", {}).get("values", [])

def generate_groq_completion(prompt: str, system_prompt: str = "You are Aegis, a Police Intelligence Assistant.") -> str:
    """
    Calls the Groq REST API using the Meta-Llama model to generate Text/GraphRAG.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set.")
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    payload = {
        "model": "llama3-8b-8192", 
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2
    }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    
    data = response.json()
    return data.get("choices", [{}])[0].get("message", {}).get("content", "")
