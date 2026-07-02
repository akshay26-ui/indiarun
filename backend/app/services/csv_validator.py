import csv
import io
from datetime import datetime

EXPECTED_HEADER = [
    "date", "dau", "mau", "retention_rate", "nps_score", 
    "csat_score", "churn_rate", "revenue", "funnel_conversion_rate"
]

def parse_and_validate_tracking_csv(file_bytes: bytes) -> tuple[list[dict], list[dict]]:
    """
    Parses a CSV file for tracking metrics and validates it against the fixed schema.
    Returns a tuple of (valid_rows, error_rows).
    valid_rows contains dicts ready to be inserted.
    error_rows contains dicts with {"row": int, "errors": list[str]}
    """
    text = file_bytes.decode("utf-8-sig")
    f = io.StringIO(text)
    
    reader = csv.reader(f)
    try:
        header = next(reader)
    except StopIteration:
        return [], [{"row": 0, "errors": ["File is empty"]}]
    
    header = [h.strip().lower() for h in header]
    
    if header != EXPECTED_HEADER:
        return [], [{"row": 1, "errors": [f"Invalid header. Expected: {','.join(EXPECTED_HEADER)}"]}]
    
    valid_rows = []
    error_rows = []
    
    for idx, row in enumerate(reader, start=2):
        if not row or all(not cell.strip() for cell in row):
            continue  # Skip empty rows
            
        if len(row) != len(EXPECTED_HEADER):
            error_rows.append({"row": idx, "errors": [f"Expected {len(EXPECTED_HEADER)} columns, got {len(row)}"]})
            continue
            
        errors = []
        parsed_data = {}
        
        # 1. Date
        try:
            parsed_data["date"] = datetime.strptime(row[0].strip(), "%Y-%m-%d").date()
        except ValueError:
            errors.append(f"Invalid date format for '{row[0]}'. Expected YYYY-MM-DD.")
            
        # 2. DAU, MAU (Integers)
        for i, field in enumerate(["dau", "mau"], start=1):
            try:
                parsed_data[field] = int(float(row[i].strip()))
            except ValueError:
                errors.append(f"Invalid integer for {field}: '{row[i]}'")
                
        # 3. Numeric fields
        numeric_fields = [
            "retention_rate", "nps_score", "csat_score", 
            "churn_rate", "revenue", "funnel_conversion_rate"
        ]
        
        for i, field in enumerate(numeric_fields, start=3):
            try:
                parsed_data[field] = float(row[i].strip())
            except ValueError:
                errors.append(f"Invalid number for {field}: '{row[i]}'")
                
        if errors:
            error_rows.append({"row": idx, "errors": errors})
        else:
            valid_rows.append(parsed_data)
            
    return valid_rows, error_rows
