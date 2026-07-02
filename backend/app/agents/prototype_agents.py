import json
import urllib.parse
import httpx
import os
import asyncio
from typing import Optional, Dict, Any
from app.services.llm import client
from google.genai import types
from pydantic import BaseModel, Field

class SpecSheetSchema(BaseModel):
    materials: str = Field(description="Description of materials used")
    format_dimensions: str = Field(description="Physical format and dimensions")
    packaging: str = Field(description="Packaging description")
    manufacturing_notes: str = Field(description="Notes on manufacturing process")

async def generate_software_code(prd_text: str, features: list) -> str:
    """Generate a Next.js/React component scaffold based on the PRD."""
    prompt = f"""
    You are an expert React/Next.js developer.
    Given the following Product Requirements Document (PRD) and prioritized features, generate a single-file React component (e.g. App.tsx or page.tsx) that serves as an interactive MVP prototype for the product.
    
    Requirements:
    1. Use Tailwind CSS for styling (classes like `flex`, `p-4`, `bg-blue-500`, etc).
    2. Use lucide-react for icons (e.g., <Home />, <Settings />).
    3. Mock any data state using React `useState` so the prototype is interactive.
    4. Provide the raw TypeScript React code ONLY. Do not include markdown formatting or backticks around the code. Start directly with imports.
    5. CRITICAL: Do NOT import any components from `@/components/ui/*` (e.g., no `import {{ Button }} from "@/components/ui/button"`). These files do not exist in the export scaffold. Instead, use standard HTML tags (e.g., `<button>`, `<div>`, `<input>`) and style them heavily with Tailwind CSS to look professional.
    
    PRD:
    {prd_text}
    
    Features:
    {features}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
            ),
        )
        code = response.text
        if code.startswith("```"):
            code = "\n".join(code.split("\n")[1:-1])
        return code.strip()
    except Exception as e:
        print(f"Error generating software code: {e}")
        return "// Error generating code"

async def deploy_software_prototype(code: str) -> str:
    token = os.environ.get("VERCEL_TOKEN")
    if not token:
        return "pending_download"
    return "https://mock-vercel-preview.vercel.app"

async def generate_physical_image(attributes: list) -> str:
    desc = " ".join([attr.get("attribute", "") for attr in attributes])
    base_prompt = f"Professional product photography, studio lighting, highly detailed concept render of: {desc}"
    encoded_prompt = urllib.parse.quote(base_prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=600&nologo=true"
    
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=30.0) as http_client:
                res = await http_client.get(url)
                if res.status_code == 200:
                    return url
        except Exception as e:
            print(f"Pollinations attempt {attempt+1} failed: {e}")
            await asyncio.sleep(2)
            
    return "https://placehold.co/800x600/png?text=Render+Unavailable,+Try+Again"

async def generate_physical_spec(attributes: list) -> dict:
    prompt = f"""
    Based on the following recommended product attributes, generate a physical spec sheet containing materials, format/dimensions, packaging, and manufacturing notes.
    
    Attributes: {attributes}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=SpecSheetSchema,
                temperature=0.3,
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating spec sheet: {e}")
        return {
            "materials": "Unknown",
            "format_dimensions": "Unknown",
            "packaging": "Unknown",
            "manufacturing_notes": "Unknown"
        }
