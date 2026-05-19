from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
import smtplib
import logging
from typing import Literal

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, body: str, content_type: Literal['plain', 'html'] = 'plain') -> bool:
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP settings are not configured: skipping send_email to %s", to_email)
        return False

    message = MIMEMultipart()
    message["From"] = settings.SMTP_FROM or settings.SMTP_USER
    message["To"] = to_email
    message["Subject"] = Header(subject, 'utf-8')
    message.attach(MIMEText(body, content_type, "utf-8"))

    try:
        timeout = getattr(settings, 'SMTP_TIMEOUT', 10)
        if getattr(settings, 'SMTP_USE_SSL', False):
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout) as server:
                server.ehlo()
                if settings.SMTP_USE_TLS:
                    try:
                        server.starttls()
                        server.ehlo()
                    except Exception:
                        pass
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM or settings.SMTP_USER, [to_email], message.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout) as server:
                server.ehlo()
                if settings.SMTP_USE_TLS:
                    server.starttls()
                    server.ehlo()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM or settings.SMTP_USER, [to_email], message.as_string())
    except Exception as e:
        logger.exception("Failed to send email to %s: %s", to_email, e)
        return False

    logger.info("Email sent to %s (subject=%s)", to_email, subject)
    return True
