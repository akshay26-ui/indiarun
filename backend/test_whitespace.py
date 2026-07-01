import requests
import json
import uuid

base_url = "http://localhost:8000/api"

# 1. Create a Project & Intake
project_id = str(uuid.uuid4())
res = requests.post(f"{base_url}/projects", json={
    "idea_name": "Smart Dog Collar",
    "product_type": "physical"
})
print("Create Project:", res.json())

# Generate Whitespace
res = requests.post(f"{base_url}/project/{project_id}/whitespace/generate", stream=True)
for line in res.iter_lines():
    if line:
        print(line.decode('utf-8'))
