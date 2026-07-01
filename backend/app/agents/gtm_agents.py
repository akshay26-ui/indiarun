import google.generativeai as genai
import os

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

async def generate_unit_economics_verdict(metrics: dict) -> str:
    """
    Takes the computed Unit Economics metrics and outputs a concise, 
    plain-language verdict about the viability of the business model.
    """
    prompt = f"""
    You are an expert startup advisor and financial analyst.
    I have a product idea with the following computed unit economics:
    
    - Customer Acquisition Cost (CAC): ${metrics.get('cac')}
    - Average Revenue Per User (ARPU): ${metrics.get('arpu')}
    - Service Delivery Cost (COGS): ${metrics.get('service_delivery_cost')}
    - Customer Lifetime (Months): {metrics.get('customer_lifetime_months')}
    
    Computed Metrics:
    - Gross Margin: ${metrics.get('gross_margin')}
    - Lifetime Value (LTV): ${metrics.get('ltv')}
    - CAC Payback Period: {metrics.get('cac_payback_months')} months
    - LTV:CAC Ratio: {metrics.get('ltv_cac_ratio')}
    
    Provide a concise, 1-2 paragraph "plain-language verdict" about the viability of this business model.
    Is this a healthy business? Are there red flags? (e.g. LTV:CAC < 3 is bad, Payback > 12 months is risky for early stage).
    Write directly to the founder. Do not use markdown backticks for the overall response. Keep it punchy and actionable.
    """
    
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return response.text.strip()

async def generate_gtm_plan_data(brand_brief_dict: dict, prd_content: str) -> dict:
    """
    Generates a 7-field GTM Plan based on the Brand Brief and PRD.
    """
    prompt = f"""
    You are an expert Go-To-Market (GTM) strategist.
    Based on the following Brand Brief and PRD, generate a structured GTM plan.
    
    Brand Brief:
    {brand_brief_dict}
    
    PRD:
    {prd_content}
    
    Output exactly in this JSON structure (no markdown backticks, just raw JSON):
    {{
        "objective": "A clear, measurable goal for the launch",
        "target_market": "A concise definition of the primary audience",
        "positioning": "How the product is positioned vs competitors",
        "gtm_motion": "e.g., Product-led, Sales-led, Community-led",
        "packaging_strategy": "How the product is priced and packaged",
        "key_differentiators": ["Diff 1", "Diff 2"],
        "success_metrics": ["Metric 1", "Metric 2"]
    }}
    """
    
    model = genai.GenerativeModel("gemini-2.5-flash", generation_config={"response_mime_type": "application/json"})
    response = model.generate_content(prompt)
    import json
    return json.loads(response.text)

