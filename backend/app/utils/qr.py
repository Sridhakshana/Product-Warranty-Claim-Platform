import base64
import io
import json

import qrcode

from app.models import Product


def build_qr_payload(product: Product):
    return json.dumps(
        {
            "type": "warranty",
            "product_code": product.product_code,
            "product_name": product.product_name,
        }
    )


def generate_qr_data_url(product: Product):
    """Return a base64 data URL containing the QR code PNG image."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(build_qr_payload(product))
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def parse_qr_payload(payload: str):
    """Decode a scanned QR payload string into a dict."""
    try:
        data = json.loads(payload)
        return data if data.get("type") == "warranty" else None
    except (ValueError, TypeError):
        return None
