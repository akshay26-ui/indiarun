import os
import json
import requests
from bs4 import BeautifulSoup
from ddgs import DDGS
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.services.llm import client
from google.genai import types

class CompetitorSchema(BaseModel):
    product_name: str
    price: float
    review_snippet: str

class CompetitorListSchema(BaseModel):
    competitors: List[CompetitorSchema]

def discover_competitors(category: str, known_competitors: List[str]) -> List[dict]:
    """
    Search DDG, scrape top results, and extract competitors using Gemini.
    """
    if not category:
        return []

    # 1. Search DuckDuckGo
    query = f"{category} products " + " ".join(known_competitors or [])
    results = []
    results_urls = []
    try:
        with DDGS() as ddgs:
            # Get top 3 URLs
            search_results = list(ddgs.text(query, max_results=3))
            
            for res in search_results:
                url = res.get("href")
                if not url:
                    continue
                
                try:
                    # Simple GET with timeout and headers
                    headers = {"User-Agent": "Mozilla/5.0"}
                    page = requests.get(url, headers=headers, timeout=5)
                    if page.status_code == 200:
                        soup = BeautifulSoup(page.text, "html.parser")
                        text_content = soup.get_text(separator=' ', strip=True)
                        results.append(text_content[:3000]) # Take first 3000 chars to avoid huge payload
                        results_urls.append(url)
                except Exception as e:
                    print(f"Error scraping {url}: {e}")
                    
    except Exception as e:
        print(f"DDGS error: {e}")
        
    if not results:
        return []

    # 2. Extract structured data with Gemini
    combined_text = "\n\n---\n\n".join(results)
    prompt = f"""
    You are an expert market analyst. Read the following scraped text from web search results about {category}.
    Extract a list of specific competitor products mentioned, along with their approximate price (if found, otherwise guess based on market) and a short review snippet or general sentiment snippet.
    
    Scraped Text:
    {combined_text}
    """
    
    if not client:
        return []
        
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=CompetitorListSchema,
                temperature=0.1,
            ),
        )
        data = json.loads(response.text)
        competitors = data.get("competitors", [])
        return {
            "competitors": competitors,
            "citations": results_urls
        }
    except Exception as e:
        print(f"Extraction error: {e}")
        return {"competitors": [], "citations": []}

def analyze_price_tiers(competitors: List[dict]) -> dict:
    """
    Bucket competitors into price tiers and find the least saturated one.
    """
    if not competitors:
        return {"error": "No competitors to analyze"}
        
    prices = [c.get("price") for c in competitors if c.get("price")]
    if not prices:
        return {"error": "No price data available"}
        
    # Define simple tiers based on min/max
    min_p = min(prices)
    max_p = max(prices)
    
    # If all prices are the same
    if max_p - min_p < 1.0:
        return {
            "tiers": [
                {"name": "Standard", "min": min_p, "max": max_p, "count": len(prices), "recommended": True}
            ]
        }
        
    range_p = max_p - min_p
    tier_size = range_p / 3
    
    tiers = [
        {"name": "Budget", "min": min_p, "max": min_p + tier_size, "count": 0, "recommended": False},
        {"name": "Mid-range", "min": min_p + tier_size, "max": min_p + 2*tier_size, "count": 0, "recommended": False},
        {"name": "Premium", "min": min_p + 2*tier_size, "max": max_p, "count": 0, "recommended": False}
    ]
    
    for p in prices:
        if p <= tiers[0]["max"]:
            tiers[0]["count"] += 1
        elif p <= tiers[1]["max"]:
            tiers[1]["count"] += 1
        else:
            tiers[2]["count"] += 1
            
    # Find least saturated
    least_saturated = min(tiers, key=lambda x: x["count"])
    least_saturated["recommended"] = True
    
    return {"tiers": tiers}

def analyze_psychographics(category: str, review_snippets: List[str]) -> dict:
    """
    Use pytrends and transformers to find psychographic driver.
    """
    if not category:
        return {"insufficient_data": True}
        
    keywords = ["health", "indulgence", "convenience", "sustainability"]
    scores = {k: 0.0 for k in keywords}
    
    # 1. Pytrends demand signal
    try:
        from pytrends.request import TrendReq
        pytrend = TrendReq(hl='en-US', tz=360, timeout=(10,25))
        
        # Build payload for exact search terms
        kw_list = [f"{category} {k}"[:100] for k in keywords]
        pytrend.build_payload(kw_list, cat=0, timeframe='today 12-m', geo='US')
        
        interest_over_time_df = pytrend.interest_over_time()
        if not interest_over_time_df.empty:
            for i, kw in enumerate(kw_list):
                if kw in interest_over_time_df.columns:
                    mean_val = interest_over_time_df[kw].mean()
                    scores[keywords[i]] += mean_val
    except Exception as e:
        print(f"Pytrends error (ignoring): {e}")
        
    # 2. Transformers sentiment on review snippets
    if review_snippets:
        try:
            from transformers import pipeline
            # Load sentiment model
            sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
            
            # Simple keyword matching for assignment, then apply sentiment score
            for snippet in review_snippets:
                res = sentiment_pipeline(snippet[:512])[0] # Truncate to max length
                score_val = res['score'] if res['label'] == 'POSITIVE' else -res['score']
                
                snippet_lower = snippet.lower()
                for k in keywords:
                    if k in snippet_lower:
                        scores[k] += score_val * 10 # weight sentiment strongly
        except Exception as e:
            print(f"Transformers error (ignoring): {e}")

    # Determine primary driver
    if all(v == 0.0 for v in scores.values()):
        return {"insufficient_data": True}
        
    primary_driver = max(scores.items(), key=lambda x: x[1])[0]
    
    evidence = f"Strongest alignment with {primary_driver} based on search trends and review sentiment analysis. Score matrix: {scores}"
    
    return {
        "driver": primary_driver,
        "evidence_summary": evidence
    }
class FailureSimulationSchema(BaseModel):
    precedent_name: str
    similarity_reason: str
    mitigation_suggestion: str

class FailureSimulationListSchema(BaseModel):
    risks: List[FailureSimulationSchema]

def assess_brand_credibility(brand_name: str, positioning: str) -> dict:
    """
    Scrape brand perception and score plausibility.
    """
    if not brand_name:
        return {"score": None, "citations": []}
        
    query = f"{brand_name} reviews reputation"
    results = []
    results_urls = []
    try:
        with DDGS() as ddgs:
            search_results = list(ddgs.text(query, max_results=3))
            for res in search_results:
                url = res.get("href")
                if not url:
                    continue
                try:
                    headers = {"User-Agent": "Mozilla/5.0"}
                    page = requests.get(url, headers=headers, timeout=5)
                    if page.status_code == 200:
                        soup = BeautifulSoup(page.text, "html.parser")
                        text_content = soup.get_text(separator=' ', strip=True)
                        results.append(text_content[:3000])
                        results_urls.append(url)
                except Exception as e:
                    print(f"Error scraping credibility for {url}: {e}")
    except Exception as e:
        print(f"DDGS error in credibility: {e}")
        
    if not results:
        return {"score": None, "citations": []}
        
    combined_text = "\n\n---\n\n".join(results)
    prompt = f"""
    You are a brand strategy expert. Review the following recent public perception data about the brand "{brand_name}".
    Then, score the plausibility (from 1.0 to 10.0) of this brand successfully pivoting to or launching the following new positioning/product: "{positioning}".
    Return ONLY a raw float number between 1.0 and 10.0 representing the credibility score.
    
    Data:
    {combined_text}
    """
    
    if not client:
        return {"score": None, "citations": []}
        
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
            ),
        )
        score_text = response.text.strip()
        score = float(score_text)
        return {"score": score, "citations": results_urls}
    except Exception as e:
        print(f"Credibility scoring error: {e}")
        return {"score": None, "citations": []}

def simulate_failure(idea_summary: str, precedents: List[dict]) -> List[dict]:
    """
    Compare new idea against precedents to simulate failure risks.
    """
    if not idea_summary or not precedents or not client:
        return []
        
    prompt = f"""
    You are an expert product strategist. 
    Analyze the following new product idea: "{idea_summary}"
    
    Compare it against the following list of historical product failures:
    {json.dumps(precedents, indent=2)}
    
    Select the top 2 to 3 most relevant historical failures that share similar risks or characteristics with the new idea.
    For each, explain the similarity reason and provide a mitigation suggestion.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=FailureSimulationListSchema,
                temperature=0.3,
            ),
        )
        data = json.loads(response.text)
        return data.get("risks", [])
    except Exception as e:
        print(f"Failure simulation error: {e}")
        return []

class RecommendedAttributeSchema(BaseModel):
    attribute: str
    rationale: str

class RecommendedAttributesListSchema(BaseModel):
    attributes: List[RecommendedAttributeSchema]

def recommend_attributes(whitespace_summary: str, psychographic_target: dict, failure_risks: List[dict]) -> List[dict]:
    """
    Recommend attributes based on whitespace, psychographics, and failure risks.
    """
    if not whitespace_summary or not client:
        return []

    prompt = f"""
    You are an expert product developer and brand strategist.
    Based on the following analysis, recommend 3 to 5 concrete product attributes (e.g., specific features, ingredients, packaging styles, or positioning angles) that this new product should adopt to succeed.
    
    1. Whitespace Summary (Market Context):
    {whitespace_summary}
    
    2. Psychographic Target (Consumer Motivation):
    {json.dumps(psychographic_target, indent=2)}
    
    3. Potential Failure Risks & Mitigations:
    {json.dumps(failure_risks, indent=2)}
    
    For each recommended attribute, provide a clear rationale explaining how it capitalizes on the whitespace, appeals to the psychographic driver, or mitigates a failure risk.
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=RecommendedAttributesListSchema,
                temperature=0.4,
            ),
        )
        data = json.loads(response.text)
        return data.get("attributes", [])
    except Exception as e:
        print(f"Attribute recommendation error: {e}")
        return []

import asyncio

async def run_whitespace_engine(project_id, db):
    """
    Async generator that executes all 5 sub-modules and yields SSE strings.
    """
    import json
    import os
    from app.models.project import Project
    from app.models.intake_brief import IntakeBrief
    from app.models.brand_brief import BrandBrief
    from app.models.source_citation import SourceCitation
    from app.models.failure_risk import FailureRisk
    from sqlalchemy.future import select

    yield f"data: {{ \"type\": \"reasoning_step\", \"message\": \"Fetching project context...\" }}\n\n"
    
    result = await db.execute(select(Project).filter(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        yield f"data: {{ \"type\": \"error\", \"message\": \"Project not found\" }}\n\n"
        return

    result = await db.execute(select(IntakeBrief).filter(IntakeBrief.project_id == project_id))
    intake = result.scalars().first()
    if not intake:
        yield f"data: {{ \"type\": \"error\", \"message\": \"Missing intake brief\" }}\n\n"
        return
        
    category = intake.category or project.idea_name
    known_competitors = intake.known_competitors or []
    
    all_citations = []
    
    yield f"data: {{ \"type\": \"reasoning_step\", \"message\": \"Searching and scraping competitors...\" }}\n\n"
    
    # 1. Discover
    discovery_res = discover_competitors(category, known_competitors)
    competitors = discovery_res.get("competitors", [])
    for url in discovery_res.get("citations", []):
        all_citations.append(SourceCitation(
            project_id=project_id,
            field_referenced="whitespace_summary",
            source_url=url,
            source_type="duckduckgo_scrape"
        ))
    
    yield f"data: {{ \"type\": \"reasoning_step\", \"message\": \"Analyzing price tiers...\" }}\n\n"
    
    # 2. Price Tiers
    price_tiers = analyze_price_tiers(competitors)
    
    yield f"data: {{ \"type\": \"reasoning_step\", \"message\": \"Running psychographic sentiment analysis...\" }}\n\n"
    
    # 3. Psychographics
    snippets = [c.get("review_snippet", "") for c in competitors]
    psychographics = analyze_psychographics(category, snippets)
    
    yield f"data: {{ \"type\": \"reasoning_step\", \"message\": \"Assessing brand credibility...\" }}\n\n"
    
    # 4. Brand Credibility
    brand_credibility_score = None
    if intake.brand_name:
        cred_res = assess_brand_credibility(intake.brand_name, project.idea_name or category)
        brand_credibility_score = cred_res.get("score")
        for url in cred_res.get("citations", []):
            all_citations.append(SourceCitation(
                project_id=project_id,
                field_referenced="brand_credibility_score",
                source_url=url,
                source_type="duckduckgo_scrape"
            ))

    yield f"data: {{ \"type\": \"reasoning_step\", \"message\": \"Simulating historical failure risks...\" }}\n\n"
    
    # 5. Failure Simulation
    precedents_path = os.path.join(os.path.dirname(__file__), "..", "data", "failure_precedents.json")
    precedents = []
    if os.path.exists(precedents_path):
        with open(precedents_path, 'r') as f:
            precedents = json.load(f)
            
    risks = simulate_failure(project.idea_name or category, precedents)
    
    summary = f"Found {len(competitors)} competitors in category {category}. Price analysis identified opportunities in {price_tiers.get('tiers', [])}. Primary psychographic driver: {psychographics.get('driver')}."
    
    yield f"data: {{ \"type\": \"reasoning_step\", \"message\": \"Generating concrete attribute recommendations...\" }}\n\n"
    
    # 6. Attribute Recommendation
    recommended_attributes = recommend_attributes(summary, psychographics, risks)
    
    yield f"data: {{ \"type\": \"reasoning_step\", \"message\": \"Saving to database...\" }}\n\n"
    
    # Enforce citations
    if not all_citations:
        yield f"data: {{ \"type\": \"error\", \"message\": \"Cannot save whitespace_summary without at least one source citation.\" }}\n\n"
        return

    result = await db.execute(select(BrandBrief).filter(BrandBrief.project_id == project_id))
    brief = result.scalars().first()
    
    if brief:
        brief.whitespace_summary = summary
        brief.psychographic_target = psychographics
        brief.price_tier_map = price_tiers
        brief.brand_credibility_score = brand_credibility_score
        brief.recommended_attributes = recommended_attributes
        brief.approved = True
    else:
        brief = BrandBrief(
            project_id=project_id,
            whitespace_summary=summary,
            psychographic_target=psychographics,
            price_tier_map=price_tiers,
            brand_credibility_score=brand_credibility_score,
            recommended_attributes=recommended_attributes,
            approved=True
        )
        db.add(brief)
        
    project.current_stage = "definition"
    await db.commit()
    await db.refresh(brief)
    
    # Update citations
    old_cits = await db.execute(select(SourceCitation).filter(SourceCitation.project_id == project_id))
    for old_c in old_cits.scalars().all():
        await db.delete(old_c)
    
    for cit in all_citations:
        db.add(cit)
        
    # Update risks
    old_risks = await db.execute(select(FailureRisk).filter(FailureRisk.brand_brief_id == brief.id))
    for r in old_risks.scalars().all():
        await db.delete(r)
        
    for r in risks:
        db.add(FailureRisk(
            brand_brief_id=brief.id,
            precedent_name=r.get("precedent_name", ""),
            similarity_reason=r.get("similarity_reason", ""),
            mitigation_suggestion=r.get("mitigation_suggestion", "")
        ))
        
    await db.commit()
    
    yield f"data: {{ \"type\": \"final_output\", \"brand_brief_id\": \"{brief.id}\" }}\n\n"

