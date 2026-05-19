function StatusBadge({ status }) {
  let backgroundColor = "#d1d5db";
  let textColor = "#1f2937";

  const statusColors = {
    "manager": { bg: "#2563eb", text: "#ffffff" },
    "engineer": { bg: "#7c3aed", text: "#ffffff" },
    "client": { bg: "#10b981", text: "#ffffff" },

    "Активен": { bg: "#10b981", text: "#ffffff" },
    "Просрочен": { bg: "#dc2626", text: "#ffffff" },
    "На продление": { bg: "#f59e0b", text: "#ffffff" },
    "Зарезервирован": { bg: "#06b6d4", text: "#ffffff" },
    "Удалён": { bg: "#6b7280", text: "#ffffff" },
    "Истекает сегодня": { bg: "#dc2626", text: "#ffffff" },

    "На согласовании": { bg: "#f59e0b", text: "#ffffff" },
    "Завершён": { bg: "#6b7280", text: "#ffffff" },
    "Приостановлен": { bg: "#ef4444", text: "#ffffff" },
    "Отменён": { bg: "#6b7280", text: "#ffffff" },

    "Ожидает оплаты": { bg: "#f59e0b", text: "#ffffff" },
    "Оплачен": { bg: "#10b981", text: "#ffffff" },
    "Отклонен": { bg: "#dc2626", text: "#ffffff" },
    "Возвращен": { bg: "#6b7280", text: "#ffffff" },
    "Частично оплачен": { bg: "#f59e0b", text: "#ffffff" },

    "Открыта": { bg: "#3b82f6", text: "#ffffff" },
    "В работе": { bg: "#f59e0b", text: "#ffffff" },
    "На утверждении": { bg: "#8b5cf6", text: "#ffffff" },
    "Завершена": { bg: "#10b981", text: "#ffffff" },
    "Отклонена": { bg: "#dc2626", text: "#ffffff" },
    "Отложена": { bg: "#6b7280", text: "#ffffff" },
  };

  if (statusColors[status]) {
    backgroundColor = statusColors[status].bg;
    textColor = statusColors[status].text;
  }

  return (
    <span
      className="status-badge"
      style={{
        backgroundColor,
        color: textColor,
        padding: "4px 12px",
        borderRadius: "16px",
        fontSize: "12px",
        fontWeight: "500",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
