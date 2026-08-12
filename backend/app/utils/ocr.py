import re

# Very light simulated OCR: parse key fields from raw text.
# A real deployment would plug in Tesseract / EasyOCR / an AI document model.

KEY_FIELDS = {
    "invoice_number": r"(invoice\s*(no|number|#)\s*[:\-]?\s*([A-Z0-9\-]+))",
    "date": r"((date|purchase\s*date)\s*[:\-]?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}))",
    "total": r"((total|amount|grand\s*total)\s*[:\-]?\s*(₹|Rs\.?|INR)?\s*(\d+(\.\d{1,2})?))",
    "customer": r"((name|customer)\s*[:\-]?\s*([A-Za-z ]+))",
}


def parse_invoice_text(text: str):
    """Best-effort extraction of common invoice fields from raw OCR text."""
    if not text:
        return {}

    result = {}
    for key, pattern in KEY_FIELDS.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result[key] = match.group(0)

    # Heuristic verification: invoice is "readable" if it has 2+ fields
    result["verified"] = len(result) >= 2
    return result
