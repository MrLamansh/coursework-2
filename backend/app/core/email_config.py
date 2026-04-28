import os

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.example.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "no-reply@example.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "secret")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)