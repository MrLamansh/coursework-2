import whois
import socket
import time
import logging
from datetime import datetime, timezone
from dateutil import parser as date_parser

logger = logging.getLogger(__name__)


def _parse_expiration(exp):
    if exp is None:
        return None
    if isinstance(exp, list):
        for e in exp:
            if e:
                exp = e
                break
    # если строка, пытаемся распарсить
    if isinstance(exp, str):
        try:
            dt = date_parser.parse(exp)
            return dt.astimezone(timezone.utc).replace(tzinfo=None)
        except Exception:
            return None
    if isinstance(exp, datetime):
        # приводим к UTC и убираем tzinfo (DB у вас хранит naive dt)
        if exp.tzinfo is not None:
            exp = exp.astimezone(timezone.utc).replace(tzinfo=None)
        return exp
    return None


def check_whois(domain_name: str, timeout: float = 10.0, retries: int = 2):
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            # Не менять глобальный таймаут: используем локальный сокет timeout
            import socket as _socket
            prev = _socket.getdefaulttimeout()
            try:
                _socket.setdefaulttimeout(timeout)
                w = whois.whois(domain_name)
            finally:
                _socket.setdefaulttimeout(prev)
            raw = getattr(w, "text", None)
            whois_server = getattr(w, "whois_server", None) or getattr(w, "registrar", None)
            exp = _parse_expiration(getattr(w, "expiration_date", None))
            registrar = getattr(w, "registrar", None) or "Unknown"
            return {
                "status": "ok",
                "expiration_date": exp,
                "registrar": registrar,
                "raw": raw,
                "whois_server": whois_server,
            }
        except Exception as exc:
            last_error = exc
            logger.debug("WHOIS attempt %s failed for %s: %s", attempt, domain_name, exc)
            if attempt < retries:
                time.sleep(0.5 * (2 ** (attempt - 1)))
    return {"status": "error", "error": str(last_error), "error_type": type(last_error).__name__}
