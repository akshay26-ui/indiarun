import logging
logger = logging.getLogger(__name__)

from pydantic import BaseModel, Field
from typing import List, Optional
from app.services.llm import client
from google.genai import types

class DemographicsSchema(BaseModel):
    age: str
    occupation: str
    location: str
    income: str

class PersonaSchema(BaseModel):
    name: str
    quote: str
    demographics: DemographicsSchema
    goals: List[str]
    pain_points: List[str]
    scenario: str

class PersonaListSchema(BaseModel):
    personas: List[PersonaSchema]

class FeatureSchema(BaseModel):
    title: str
    description: str
    reach: float = Field(description="Score from 1 to 10")
    impact: float = Field(description="Score from 1 to 10")
    confidence: float = Field(description="Percentage from 0 to 1")

class FeatureListSchema(BaseModel):
    features: List[FeatureSchema]

class PRDSchema(BaseModel):
    content_markdown: str


def generate_personas(intake_brief_dict: dict, brand_brief_dict: dict) -> list[dict]:
    prompt = f"""
    Given the following product brief and whitespace brand brief, generate 1-2 distinct target personas.
    
    Intake Brief: {intake_brief_dict}
    Brand Brief: {brand_brief_dict}
    """
    
    if not client:
        return []
        
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=PersonaListSchema,
                temperature=0.4,
            ),
        )
        data = response.text
        import json
        parsed = json.loads(data)
        return parsed.get("personas", [])
    except Exception as e:
        logger.warning(f"Error generating personas: {e}")
        return []

def generate_features(intake_brief_dict: dict, personas_list: list) -> list[dict]:
    prompt = f"""
    Given the product brief and the target personas, generate a list of 5-8 candidate core features for an MVP.
    For each feature, estimate Reach (1-10), Impact (1-10), and Confidence (0.0-1.0).
    
    Intake Brief: {intake_brief_dict}
    Personas: {personas_list}
    """
    
    if not client:
        return []
        
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=FeatureListSchema,
                temperature=0.4,
            ),
        )
        data = response.text
        import json
        parsed = json.loads(data)
        return parsed.get("features", [])
    except Exception as e:
        logger.warning(f"Error generating features: {e}")
        return []

def generate_prd(intake_brief_dict: dict, brand_brief_dict: dict, personas_list: list, features_list: list) -> str:
    prompt = f"""
    You are an expert Product Manager. Compile the following inputs into a comprehensive Product Requirements Document (PRD) using an Uber-style template.
    Use Markdown formatting. Include sections for: Objective, Context, Opportunity, User Personas, Features & Prioritization.
    
    Intake Brief: {intake_brief_dict}
    Brand Brief: {brand_brief_dict}
    Personas: {personas_list}
    Features: {features_list}
    """
    
    if not client:
        return "# PRD Preview\nLLM client not configured."
        
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=PRDSchema,
                temperature=0.4,
            ),
        )
        data = response.text
        import json
        parsed = json.loads(data)
        return parsed.get("content_markdown", "")
    except Exception as e:
        logger.warning(f"Error generating PRD: {e}")
        return "# Error generating PRD\nPlease check backend logs."
