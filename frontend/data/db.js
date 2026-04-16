// data/db.js — глобальный слой данных и API-адаптер

window.API_BASE = "http://127.0.0.1:8000";

// Глобальные массивы — аналог таблиц в памяти браузера
window.clients   = window.clients   || [];
window.domains   = window.domains   || [];
window.requests  = window.requests  || [];
window.contracts = window.contracts || [];
window.payments  = window.payments  || [];
window.activity  = window.activity  || [];

// Универсальный API-клиент
window.api = async function(path, options = {}) {
  const res = await fetch(`${window.API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  if (res.status === 204) return null;
  return await res.json();
};

// Нормализаторы — приводят ответ API к формату фронта

window.normalizeClient = function(c) {
  return {
    id: c.id,
    name: c.name ?? "",
    contact: c.contact ?? c.contact_person ?? c.contactperson ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    inn: c.inn ?? ""
  };
};

window.normalizeDomain = function(d) {
  return {
    id: d.id,
    name: d.domain_name ?? d.domainname ?? "",
    client: d.client_id ?? d.clientid ?? null,
    registrar: d.registrar_id ?? d.registrarid ?? null,
    regDate: d.registration_date ?? d.registrationdate ?? "",
    expDate: d.expiration_date ?? d.expirationdate ?? "",
    status: d.current_status_id ?? d.currentstatusid ?? null,
    note: d.note ?? ""
  };
};

window.normalizePayment = function(p) {
  return {
    id: p.id,
    date: p.payment_date ?? p.paymentdate ?? "",
    domain: p.domain_id ?? p.domainid ?? null,
    client: p.client_id ?? p.clientid ?? null,
    amount: p.amount ?? 0,
    type: p.payment_type_id ?? p.paymenttypeid ?? null,
    status: p.payment_status_id ?? p.paymentstatusid ?? null
  };
};

window.clientToApi = function(payload) {
  return {
    name: payload.name,
    contact_person: payload.contact,
    email: payload.email,
    phone: payload.phone || null,
    inn: payload.inn || null
  };
};