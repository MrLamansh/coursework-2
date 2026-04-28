export function getDaysUntilExpiry(expirationDate) {
  if (!expirationDate) return null;

  const today = new Date();
  const expiry = new Date(expirationDate);

  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry - today;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getExpiryColor(expirationDate) {
  const daysLeft = getDaysUntilExpiry(expirationDate);

  if (daysLeft === null) return "transparent";
  if (daysLeft < 7) return "#fee2e2";
  if (daysLeft < 30) return "#fef3c7";

  return "transparent";
}

export function getExpiryLabel(expirationDate) {
  const daysLeft = getDaysUntilExpiry(expirationDate);

  if (daysLeft === null) return "—";
  if (daysLeft < 0) return "Просрочен";
  if (daysLeft === 0) return "Сегодня";
  if (daysLeft < 30) return `${daysLeft} дн.`;

  return "OK";
}
