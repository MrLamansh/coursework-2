import whois
from datetime import datetime, timezone


def check_whois(domain_name: str) -> dict:
    """
    Делает WHOIS-запрос для домена.
    Возвращает дату истечения и регистратора, либо ошибку.
    """
    try:
        import socket
        socket.setdefaulttimeout(10)
        w = whois.whois(domain_name)

        exp = w.expiration_date
        if isinstance(exp, list):
            exp = exp[0]

        # Убираем timezone если есть, чтобы сравнивать с naive datetime из БД
        if exp and exp.tzinfo is not None:
            exp = exp.replace(tzinfo=None)

        registrar = w.registrar or "Unknown"

        return {
            "status": "ok",
            "expiration_date": exp,
            "registrar": registrar
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}