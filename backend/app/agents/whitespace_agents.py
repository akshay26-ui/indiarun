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
        # return as list of dicts
        return data.get("competitors", [])
    except Exception as e:
        print(f"Extraction error: {e}")
        return []

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
