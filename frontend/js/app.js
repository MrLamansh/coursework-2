// js/app.js — Главный модуль приложения

function showPage(name) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  const page = document.getElementById("page-" + name);
  if (page) page.classList.add("active");

  const nav = document.querySelector('.nav-item[data-page="' + name + '"]');
  if (nav) nav.classList.add("active");

  const titles = {
    dashboard: "Дашборд",
    domains: "Реестр доменов",
    requests: "Заявки",
    clients: "Клиенты",
    contracts: "Договоры",
    payments: "Платежи",
    reports: "Отчёты",
  };

  document.getElementById("page-title").textContent = titles[name] || name;

  const renders = {
    dashboard: renderDashboard,
    domains: loadDomainsFromApi,
    requests: loadRequestsFromApi,
    clients: loadClientsFromApi,
    payments: renderPayments,
    reports: renderReports,
  };

  if (renders[name]) renders[name]();
  closeMobileMenu();
}

(function () {
  const root = document.documentElement;
  const btn = document.querySelector("[data-theme-toggle]");
  let theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  root.setAttribute("data-theme", theme);

  function updateIcon() {
    if (!btn) return;
    btn.innerHTML = theme === "dark"
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <circle cx="12" cy="12" r="5"></circle>
           <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
         </svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
         </svg>`;
  }

  updateIcon();

  if (btn) {
    btn.addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", theme);
      updateIcon();
    });
  }
})();

function openMobileMenu() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("mob-overlay").classList.add("open");
}

function closeMobileMenu() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("mob-overlay").classList.remove("open");
}

function globalSearch(q) {
  if (!q.trim()) return;

  const found = domains.filter(d => d.name.toLowerCase().includes(q.toLowerCase()));

  if (found.length) {
    showPage("domains");
    setTimeout(() => {
      const inp = document.getElementById("dom-search");
      if (inp) {
        inp.value = q;
        loadDomainsFromApi();
      }
    }, 50);
  } else {
    showToast("Ничего не найдено по запросу «" + q + "»", "info");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  showPage("dashboard");
});