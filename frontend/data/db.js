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

window.normalizeClient = function(c) {
  return {
    id: c.id, name: c.name ?? "", contact: c.contact_person ?? "",
    email: c.email ?? "", phone: c.phone ?? "", inn: c.inn ?? ""
  };
};

window.clientToApi = function(payload) {
  return {
    name: payload.name, contact_person: payload.contact,
    email: payload.email, phone: payload.phone || null, inn: payload.inn || null
  };
};

window.normalizeDomain = function(d) {
  return {
    id: d.id, name: d.domain_name ?? "", client: d.contract_id ?? 1,
    registrar: "REG.RU",
    regDate: d.registration_date ? d.registration_date.split('T')[0] : "",
    expDate: d.expiration_date ? d.expiration_date.split('T')[0] : "",
    price: 0, status: d.current_status_id == 1 ? 'active' : 'expiring', note: ""
  };
};

window.domainToApi = function(payload) {
  return {
    domain_name: payload.name, contract_id: parseInt(payload.client) || 1,
    registrar_id: 1, current_status_id: 1,
    registration_date: payload.regDate ? new Date(payload.regDate).toISOString() : new Date().toISOString(),
    expiration_date: payload.expDate ? new Date(payload.expDate).toISOString() : new Date().toISOString()
  };
};

window.normalizeContract = function(c) {
  return {
    id: c.id, client: c.client_id,
    date: c.sign_date ? c.sign_date.split('T')[0] : "",
    contactnumber: c.contact_number ?? "",
    status: c.status_id == 1 ? 'active' : 'inactive', terms: c.payment_terms ?? ""
  };
};

window.contractToApi = function(payload) {
  return {
    contact_number: payload.contactnumber || `DOC-${Date.now()}`,
    sign_date: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString(),
    status_id: 1, payment_terms: payload.terms || "", client_id: parseInt(payload.client) || 1
  };
};