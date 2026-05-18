import { useEffect, useMemo, useState } from "react";
import { getContracts } from "../api/contracts";
import { getDomains } from "../api/domains";

const EMPTY_OPTIONS = Object.freeze([]);

const toOptionLabel = (item, fallbackPrefix) => {
  if (!item) {
	return "";
  }

  return item.name || item.title || `${fallbackPrefix} #${item.id}`;
};

const normalizeNullableInt = (value) => {
  if (value === "" || value === null || value === undefined) {
	return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function RequestForm({
  onSubmit,
  onCancel,
  loading,
  initialData = null,
  requestTypeOptions = EMPTY_OPTIONS,
  requestStatusOptions = EMPTY_OPTIONS,
  clientOptions = EMPTY_OPTIONS,
  contractOptions = EMPTY_OPTIONS,
  domainOptions = EMPTY_OPTIONS,
  engineerOptions = EMPTY_OPTIONS,
  mode = "all", // "all" для менеджера, "client" для клиента
}) {
  const isClientMode = mode === "client";

  const [formData, setFormData] = useState({
	request_type_id: "",
	execution_status_id: "",
	client_id: "",
	contract_id: "",
	domain_id: "",
	assigned_engineer_id: "",
	description: "",
  });
  const [availableContracts, setAvailableContracts] = useState(null);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [availableDomains, setAvailableDomains] = useState(null);
  const [domainsLoading, setDomainsLoading] = useState(false);

  useEffect(() => {
	if (initialData) {
	  setFormData({
		request_type_id: initialData.request_type_id || "",
		execution_status_id: initialData.execution_status_id || "",
		client_id: initialData.client_id || "",
		contract_id: initialData.contract_id || "",
		domain_id: initialData.domain_id || "",
		assigned_engineer_id: initialData.assigned_engineer_id || "",
		description: initialData.description || "",
	  });
	} else {
	  setFormData({
		request_type_id: "",
		execution_status_id: "",
		client_id: "",
		contract_id: "",
		domain_id: "",
		assigned_engineer_id: "",
		description: "",
	  });
	}
  }, [initialData]);

  const selectedClientId = normalizeNullableInt(formData.client_id);
  const selectedContractId = normalizeNullableInt(formData.contract_id);

  const fallbackContractsForClient = useMemo(() => {
	if (isClientMode) {
	  return contractOptions;
	}

	if (!selectedClientId) {
	  return [];
	}

	return contractOptions.filter(
	  (contract) => String(contract.client_id) === String(selectedClientId)
	);
  }, [contractOptions, isClientMode, selectedClientId]);

  const visibleContracts = isClientMode
  ? availableContracts ?? fallbackContractsForClient
  : selectedClientId
  ? availableContracts ?? fallbackContractsForClient
  : [];

  const fallbackDomainsForContract = useMemo(() => {
	if (!selectedContractId) {
	  return [];
	}

	return domainOptions.filter(
	  (domain) => String(domain.contract_id) === String(selectedContractId)
	);
  }, [domainOptions, selectedContractId]);

  const visibleDomains =
	selectedContractId ? availableDomains ?? fallbackDomainsForContract : [];

  useEffect(() => {
	let isActive = true;

	if (!isClientMode && !selectedClientId) {
	  setAvailableContracts([]);
	  setContractsLoading(false);
	  setFormData((prev) =>
		prev.contract_id ? { ...prev, contract_id: "" } : prev
	  );
	  return () => {
		isActive = false;
	  };
	}

	const loadContracts = async () => {
	  setContractsLoading(true);

	  try {
		const contracts = isClientMode
		  ? await getContracts()
		  : await getContracts(selectedClientId);
		if (!isActive) {
		  return;
		}

		setAvailableContracts(Array.isArray(contracts) ? contracts : []);
		setFormData((prev) => {
		  if (!prev.contract_id) {
			return prev;
		  }

		  const hasSelectedContract = (Array.isArray(contracts) ? contracts : []).some(
			(contract) => String(contract.id) === String(prev.contract_id)
		  );

		  return hasSelectedContract ? prev : { ...prev, contract_id: "" };
		});
	  } catch (error) {
		if (!isActive) {
		  return;
		}

		setAvailableContracts([]);
		setFormData((prev) => {
		  if (!prev.contract_id) {
			return prev;
		  }

		  return { ...prev, contract_id: "", domain_id: "" };
		});
	  } finally {
		if (isActive) {
		  setContractsLoading(false);
		}
	  }
	};

	loadContracts();

	return () => {
	  isActive = false;
	};
  }, [isClientMode, selectedClientId]);

  useEffect(() => {
	let isActive = true;

	if (!selectedContractId) {
	  setAvailableDomains([]);
	  setDomainsLoading(false);
	  setFormData((prev) =>
		prev.domain_id ? { ...prev, domain_id: "" } : prev
	  );
	  return () => {
		isActive = false;
	  };
	}

	const loadDomains = async () => {
	  setDomainsLoading(true);

	  try {
		const domains = await getDomains(selectedContractId);
		if (!isActive) {
		  return;
		}

		const normalizedDomains = Array.isArray(domains) ? domains : [];
		setAvailableDomains(normalizedDomains);
		setFormData((prev) => {
		  if (!prev.domain_id) {
			return prev;
		  }

		  const hasSelectedDomain = normalizedDomains.some(
			(domain) => String(domain.id) === String(prev.domain_id)
		  );

		  return hasSelectedDomain ? prev : { ...prev, domain_id: "" };
		});
	  } catch (error) {
		if (!isActive) {
		  return;
		}

					setAvailableDomains(fallbackDomainsForContract);
		setFormData((prev) => {
		  if (!prev.domain_id) {
			return prev;
		  }

		  const hasSelectedDomain = fallbackDomainsForContract.some(
			(domain) => String(domain.id) === String(prev.domain_id)
		  );

		  return hasSelectedDomain ? prev : { ...prev, domain_id: "" };
		});
	  } finally {
		if (isActive) {
		  setDomainsLoading(false);
		}
	  }
	};

	loadDomains();

	return () => {
	  isActive = false;
	};
  }, [selectedContractId]);

  const handleChange = (event) => {
	const { name, value } = event.target;

	if (name === "client_id") {
	  setFormData((prev) => ({
		...prev,
		client_id: value,
		contract_id: "",
		domain_id: "",
	  }));
	  setAvailableContracts(null);
	  setAvailableDomains(null);
	  return;
	}

	if (name === "contract_id") {
	  setFormData((prev) => ({
		...prev,
		contract_id: value,
		domain_id: "",
	  }));
	  setAvailableDomains(null);
	  return;
	}

	setFormData((prev) => ({
	  ...prev,
	  [name]: value,
	}));
  };

  const handleSubmit = (event) => {
	event.preventDefault();

	// Для клиента не отправляем client_id и assigned_engineer_id
	if (isClientMode) {
	  onSubmit({
		request_type_id: Number(formData.request_type_id),
		contract_id: normalizeNullableInt(formData.contract_id),
		domain_id: normalizeNullableInt(formData.domain_id),
		description: formData.description.trim() || null,
		// client_id и assigned_engineer_id заполняются на бэкенде
	  });
	} else {
	  onSubmit({
		request_type_id: Number(formData.request_type_id),
		execution_status_id: Number(formData.execution_status_id),
		client_id: Number(formData.client_id),
		contract_id: normalizeNullableInt(formData.contract_id),
		domain_id: normalizeNullableInt(formData.domain_id),
		assigned_engineer_id: normalizeNullableInt(formData.assigned_engineer_id),
		description: formData.description.trim() || null,
	  });
	}
  };

  const hasRequestTypeOptions = requestTypeOptions.length > 0;
  const hasRequestStatusOptions = requestStatusOptions.length > 0;
  const hasClientOptions = clientOptions.length > 0;
  const hasDomainOptions = domainOptions.length > 0;
  const hasEngineerOptions = engineerOptions.length > 0;
  const contractSelectDisabled = isClientMode
	? contractsLoading || visibleContracts.length === 0
	: !selectedClientId || contractsLoading || visibleContracts.length === 0;
  const contractSelectPlaceholder = isClientMode
	? contractsLoading
	  ? "Загружаем договоры..."
	  : visibleContracts.length === 0
	  ? "Договоры не найдены"
	  : "Выберите договор (необязательно)"
	: !selectedClientId
	? "Сначала выберите клиента"
	: contractsLoading
	? "Загружаем договоры..."
	: visibleContracts.length === 0
	? "У клиента нет договоров"
	: "Выберите договор";
  const domainSelectDisabled =
	!selectedContractId || domainsLoading || visibleDomains.length === 0;
  const domainSelectPlaceholder = !selectedContractId
	? "Сначала выберите договор"
	: domainsLoading
	? "Загружаем домены..."
	: visibleDomains.length === 0
	? "У договора нет доменов"
	: "Выберите домен";

  return (
	<form onSubmit={handleSubmit} style={formStyle}>
	  <h3 style={{ marginBottom: "16px" }}>
		{initialData ? "Редактировать заявку" : "Добавить заявку"}
	  </h3>

	  <label style={labelStyle}>
		Тип заявки
		{hasRequestTypeOptions ? (
		  <select
			name="request_type_id"
			value={formData.request_type_id}
			onChange={handleChange}
			required
			style={inputStyle}
		  >
			<option value="">Выберите тип</option>
			{requestTypeOptions.map((item) => (
			  <option key={item.id} value={item.id}>
				{toOptionLabel(item, "Тип")}
			  </option>
			))}
		  </select>
		) : (
		  <input
			type="number"
			name="request_type_id"
			placeholder="ID типа заявки"
			value={formData.request_type_id}
			onChange={handleChange}
			required
			min="1"
			style={inputStyle}
		  />
		)}
	  </label>

	  {!isClientMode && (
		<label style={labelStyle}>
		  Статус выполнения
		  {hasRequestStatusOptions ? (
			<select
			  name="execution_status_id"
			  value={formData.execution_status_id}
			  onChange={handleChange}
			  required
			  style={inputStyle}
			>
			  <option value="">Выберите статус</option>
			  {requestStatusOptions.map((item) => (
				<option key={item.id} value={item.id}>
				  {toOptionLabel(item, "Статус")}
				</option>
			  ))}
			</select>
		  ) : (
			<input
			  type="number"
			  name="execution_status_id"
			  placeholder="ID статуса выполнения"
			  value={formData.execution_status_id}
			  onChange={handleChange}
			  required
			  min="1"
			  style={inputStyle}
			/>
		  )}
		</label>
	  )}

	  {!isClientMode && (
		<label style={labelStyle}>
		  Клиент
		  {hasClientOptions ? (
			<select
			  name="client_id"
			  value={formData.client_id}
			  onChange={handleChange}
			  required
			  style={inputStyle}
			>
			  <option value="">Выберите клиента</option>
			  {clientOptions.map((client) => (
				<option key={client.id} value={client.id}>
				  {client.name || client.contact_person || `Клиент #${client.id}`}
				</option>
			  ))}
			</select>
		  ) : (
			<input
			  type="number"
			  name="client_id"
			  placeholder="ID клиента"
			  value={formData.client_id}
			  onChange={handleChange}
			  required
			  min="1"
			  style={inputStyle}
			/>
		  )}
		</label>
	  )}

	  <label style={labelStyle}>
		Договор
		<select
		  name="contract_id"
		  value={formData.contract_id}
		  onChange={handleChange}
		  required={!isClientMode}
		  disabled={contractSelectDisabled}
		  style={inputStyle}
		>
		  <option value="">{contractSelectPlaceholder}</option>
		  {visibleContracts.map((contract) => (
			<option key={contract.id} value={contract.id}>
			  {contract.contact_number || `Договор #${contract.id}`}
			</option>
		  ))}
		</select>
	  </label>

	  <label style={labelStyle}>
		Домен
		{isClientMode || hasDomainOptions ? (
		  <select
			name="domain_id"
			value={formData.domain_id}
			onChange={handleChange}
			disabled={domainSelectDisabled}
			style={inputStyle}
		  >
			<option value="">{domainSelectPlaceholder}</option>
			{visibleDomains.map((domain) => (
			  <option key={domain.id} value={domain.id}>
				{domain.domain_name || `Домен #${domain.id}`}
			  </option>
			))}
		  </select>
		) : (
		  <input
			type="number"
			name="domain_id"
			placeholder="ID домена (необязательно)"
			value={formData.domain_id}
			onChange={handleChange}
			min="1"
			style={inputStyle}
		  />
		)}
	  </label>

	  {!isClientMode && (
		<label style={labelStyle}>
		  Назначенный инженер
		  {hasEngineerOptions ? (
			<select
			  name="assigned_engineer_id"
			  value={formData.assigned_engineer_id}
			  onChange={handleChange}
			  style={inputStyle}
			>
			  <option value="">Выберите инженера (необязательно)</option>
			  {engineerOptions.map((engineer) => (
				<option key={engineer.id} value={engineer.id}>
				  {engineer.username || `Инженер #${engineer.id}`}
				</option>
			  ))}
			</select>
		  ) : (
			<input
			  type="number"
			  name="assigned_engineer_id"
			  placeholder="ID инженера (необязательно)"
			  value={formData.assigned_engineer_id}
			  onChange={handleChange}
			  min="1"
			  style={inputStyle}
			/>
		  )}
		</label>
	  )}

	  <label style={labelStyle}>
		Описание
		<textarea
		  name="description"
		  placeholder="Описание заявки"
		  value={formData.description}
		  onChange={handleChange}
		  rows={4}
		  style={{ ...inputStyle, resize: "vertical" }}
		/>
	  </label>

	  <div style={{ display: "flex", gap: "12px" }}>
		<button type="submit" disabled={loading} style={saveButtonStyle}>
		  {loading
			? initialData
			  ? "Сохранение..."
			  : "Создание..."
			: initialData
			? "Сохранить изменения"
			: "Сохранить"}
		</button>

		<button type="button" onClick={onCancel} style={cancelButtonStyle}>
		  Отмена
		</button>
	  </div>
	</form>
  );
}

const formStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  marginBottom: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  border: "1px solid #e5e7eb",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  fontSize: "14px",
  color: "#4b5563",
};

const inputStyle = {
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
};

const saveButtonStyle = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
};

const cancelButtonStyle = {
  background: "#e5e7eb",
  color: "#111827",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
};

export default RequestForm;

