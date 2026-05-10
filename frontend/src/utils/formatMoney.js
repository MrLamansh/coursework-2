export function formatMoney(value, currency = "RUB") {
  if (value === null || value === undefined || value === "") return "—";

  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return "—";

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(numberValue);
}

