import logging
logger = logging.getLogger(__name__)

import os
from google import genai

from app.config import settings

# Initialize the client with the API key from config
# If GEMINI_API_KEY is not set or is empty, we attempt to get it from the environment directly
# If it's still missing, the client initialization will fail or default to environment checking.
api_key = settings.GEMINI_API_KEY if settings.GEMINI_API_KEY else os.environ.get("GEMINI_API_KEY")

try:
    client = genai.Client(api_key=api_key)
except Exception as e:
    # If the key is missing or invalid, we print a warning. The client might not be usable.
    logger.warning(f"Warning: Failed to initialize Google GenAI client. Ensure GEMINI_API_KEY is set. Error: {e}")
    client = None

def get_llm_client():
    return client
