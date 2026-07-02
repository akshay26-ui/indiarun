import logging
logger = logging.getLogger(__name__)

import json
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.services.llm import get_llm_client
from google.genai import types

class IntakeBriefSchema(BaseModel):
    agent_reply: str = Field(description="The conversational reply the agent gives to the user, asking the next logical question or acknowledging their input.")
    idea_summary: Optional[str] = Field(None, description="A 1-2 sentence summary of the core product idea. Keep it concise.")
    problem_statement: Optional[str] = Field(None, description="The core problem the product solves.")
    target_user: Optional[str] = Field(None, description="Who is the primary user or customer?")
    product_type: Optional[str] = Field(None, description="Must be 'software' or 'physical'.")
    known_competitors: Optional[List[str]] = Field(None, description="List of competitors mentioned.")
    category: Optional[str] = Field(None, description="The industry or category (e.g. HealthTech, EdTech, Consumer Goods).")
    budget_constraint: Optional[str] = Field(None, description="Any mentioned budget constraints.")
    timeline_constraint: Optional[str] = Field(None, description="Any mentioned timeline constraints.")

def run_intake_turn(chat_history: List[Dict[str, str]], current_state: Dict[str, Any]) -> IntakeBriefSchema:
    """
    Given the chat history and the current state of the brief, 
    ask the LLM to provide an agent reply and the updated brief fields.
    """
    client = get_llm_client()
    if not client:
        # Fallback if no LLM configured
        return IntakeBriefSchema(
            agent_reply="I'm sorry, my AI backend is not configured yet. Please configure GEMINI_API_KEY.",
        )
    
    # Construct the prompt
    system_instruction = """You are an expert Product Manager conducting an 'Idea Intake' interview with a founder.
Your goal is to extract the following information to build a structured project brief:
1. idea_summary (What is the core idea?)
2. problem_statement (What problem does it solve?)
3. target_user (Who is it for?)
4. product_type (Is it software or physical?)
5. known_competitors (Who are the competitors?)
6. category (What industry?)
7. budget_constraint (Any budget limits?)
8. timeline_constraint (Any deadlines?)

You are given the CURRENT STATE of these fields, and the CHAT HISTORY.
Your job is to:
1. Update the CURRENT STATE with any new information from the user's latest message.
2. Provide a conversational, encouraging reply (agent_reply) that acknowledges what they said and asks exactly ONE focused question to fill in the missing fields. If all required fields (idea_summary, problem_statement, target_user, product_type) are filled, tell them it looks good and they can continue.

Do NOT overwhelm the user with multiple questions. Ask one at a time.
Output must strictly match the JSON schema.
"""
    
    prompt = f"CURRENT STATE:\n{json.dumps(current_state, indent=2)}\n\nCHAT HISTORY:\n"
    for msg in chat_history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        prompt += f"{role.upper()}: {content}\n"
        
    prompt += "\nUpdate the brief based on the latest message and provide your next reply."

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=IntakeBriefSchema,
                temperature=0.2,
            ),
        )
        
        # Parse the JSON response
        result_dict = json.loads(response.text)
        return IntakeBriefSchema(**result_dict)
    except Exception as e:
        logger.warning(f"Error in intake agent: {e}")
        return IntakeBriefSchema(
            agent_reply="I encountered an error processing your request. Please try again.",
        )
