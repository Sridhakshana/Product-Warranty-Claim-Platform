from fastapi import APIRouter
from app.schemas import ChatMessage, ChatResponse

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


def keyword_reply(message: str):
    text = message.lower()
    rules = [
        (
            ["warranty", "valid", "check"],
            "You can check your warranty status by going to 'My Products' and "
            "clicking the warranty status on any product.",
        ),
        (
            ["claim", "submit", "file"],
            "To submit a claim, go to 'My Products', pick the product, and click "
            "'Submit Claim'. The product must be under warranty.",
        ),
        (
            ["track", "status", "progress"],
            "You can track your claim in the 'My Claims' section. You'll also get "
            "a notification whenever the status changes.",
        ),
        (
            ["invoice", "upload", "bill"],
            "You can upload your purchase invoice in the product details page to "
            "verify your purchase and speed up claim approval.",
        ),
        (
            ["service center", "service", "repair"],
            "Approved claims are assigned to a nearby authorized service center. "
            "You can see the assigned center on the claim details page.",
        ),
        (
            ["duplicate", "already"],
            "Duplicate claims for the same product are automatically detected and "
            "blocked to prevent fraud.",
        ),
        (
            ["qr", "scan"],
            "Every registered product gets a unique QR code. You can scan it to "
            "verify the product and its warranty instantly.",
        ),
        (
            ["expired", "expiry"],
            "A product whose warranty period has ended cannot be claimed. "
            "The platform shows the exact warranty end date for each product.",
        ),
        (
            ["admin", "dashboard", "report"],
            "Admins can view analytics, approve/reject claims, assign service "
            "centers, and download CSV reports from the admin dashboard.",
        ),
        (
            ["password", "login", "register", "sign"],
            "Use the Register page to create an account and the Login page to "
            "sign in. Contact the admin if you lose your password.",
        ),
        (
            ["refund", "money", "return"],
            "Warranty claims cover repair or replacement of defective products "
            "under the warranty terms. Refunds are not handled by this portal.",
        ),
    ]
    for keywords, reply in rules:
        if any(kw in text for kw in keywords):
            return reply, "matched"
    return (
        "I'm the warranty support assistant. I can help with warranty checks, "
        "claim submission, tracking, invoices, QR codes, and service centers. "
        "Try asking 'How do I check my warranty?'",
        "fallback",
    )


@router.post("/ask", response_model=ChatResponse)
def ask(chat: ChatMessage):
    reply, intent = keyword_reply(chat.message)
    return {"reply": reply, "intent": intent}
