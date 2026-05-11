import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";

import apiClient from "../api/client";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";

const DAYS_IN_MS = 1000 * 60 * 60 * 24;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("ru-RU");
};

const getDaysLeft = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / DAYS_IN_MS);
};

const getDomainStatusLabel = (domain) => {
  return String(
    domain?.status?.name ||
      domain?.status_name ||
      domain?.status ||
      domain?.current_status ||
      ""
  ).toLowerCase();
};

const isSoftDeleted = (item) => item?.is_deleted === true;

const isExpiredDomain = (domain) => {
  if (!domain || isSoftDeleted(domain)) return false;
  const daysLeft = getDaysLeft(domain.expiration_date);
  const status = getDomainStatusLabel(domain);
  return (
    (daysLeft !== null && daysLeft < 0) ||
    status.includes("проср") ||
    status.includes("expired") ||
    status.includes("истек")
  );
};

const isActiveDomain = (domain) => {
  if (!domain || isSoftDeleted(domain) || isExpiredDomain(domain)) return false;
  const status = getDomainStatusLabel(domain);
  if (!status) {
    const daysLeft = getDaysLeft(domain.expiration_date);
    return daysLeft === null || daysLeft >= 0;
  }
  return status.includes("актив") || status.includes("active");
};

const isExpiringInDays = (domain, maxDays) => {
  if (!domain || isSoftDeleted(domain) || isExpiredDomain(domain)) return false;
  const daysLeft = getDaysLeft(domain.expiration_date);
  return daysLeft !== null && daysLeft >= 0 && daysLeft <= maxDays;
};

const isOpenRequest = (request, statusById) => {
  if (!request || isSoftDeleted(request)) return false;
  const statusName = String(
    request?.execution_status?.name ||
      statusById.get(String(request.execution_status_id)) ||
      ""
  ).toLowerCase();
  return (
    statusName.includes("откры") ||
    statusName.includes("в работе") ||
    statusName.includes("new") ||
    statusName.includes("in_progress") ||
    statusName.includes("in progress")
  );
};

const sortByDateDesc = (items) => {
  return [...(items || [])].sort((a, b) => {
    const aTime = new Date(a?.created_at || 0).getTime();
    const bTime = new Date(b?.created_at || 0).getTime();
    return bTime - aTime;
  });
};


function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const [requestTypes, setRequestTypes] = useState([]);
  const [requestStatuses, setRequestStatuses] = useState([]);

  const [summary, setSummary] = useState({
    activeDomains: 0,
    expiringDomains: 0,
    openRequests: 0,
    expiredDomains: 0,
  });

  const [urgentDomains, setUrgentDomains] = useState([]);
  const [latestRequests, setLatestRequests] = useState([]);

  const requestTypeById = useMemo(() => {
    return new Map(requestTypes.map((item) => [String(item.id), item.name]));
  }, [requestTypes]);

  const requestStatusById = useMemo(() => {
    return new Map(requestStatuses.map((item) => [String(item.id), item.name]));
  }, [requestStatuses]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        if (isManager) {
          const [domainsRes, requestsRes, latestRequestsRes, requestTypesRes, requestStatusesRes] = await Promise.all([
            apiClient.get("/domains/"),
            apiClient.get("/requests/"),
            apiClient.get("/requests/", { params: { limit: 5, order: "desc" } }),
            apiClient.get("/directories/request-types"),
            apiClient.get("/directories/request-statuses"),
          ]);

          const domains = (domainsRes.data || []).filter((item) => !isSoftDeleted(item));
          const requests = (requestsRes.data || []).filter((item) => !isSoftDeleted(item));
          const statuses = requestStatusesRes.data || [];
          const localStatusById = new Map(
            statuses.map((item) => [String(item.id), item.name])
          );

          const activeDomains = domains.filter(isActiveDomain);
          const expiringDomains = domains.filter((domain) => isExpiringInDays(domain, 30));
          const expiredDomains = domains.filter(isExpiredDomain);
          const openRequests = requests.filter((request) =>
            isOpenRequest(request, localStatusById)
          );
          const urgent = domains.filter((domain) => isExpiringInDays(domain, 7));

          setSummary({
            activeDomains: activeDomains.length,
            expiringDomains: expiringDomains.length,
            openRequests: openRequests.length,
            expiredDomains: expiredDomains.length,
          });

          setUrgentDomains(urgent);
          setLatestRequests(sortByDateDesc(latestRequestsRes.data || []).slice(0, 5));
          setRequestTypes(requestTypesRes.data || []);
          setRequestStatuses(statuses);
        } else {
          const [domainsRes, requestsRes, latestRequestsRes, requestTypesRes, requestStatusesRes] = await Promise.all([
            apiClient.get("/domains/my"),
            apiClient.get("/requests/my"),
            apiClient.get("/requests/my", { params: { limit: 5, order: "desc" } }),
            apiClient.get("/directories/request-types"),
            apiClient.get("/directories/request-statuses"),
          ]);

          const domains = (domainsRes.data || []).filter((item) => !isSoftDeleted(item));
          const requests = (requestsRes.data || []).filter((item) => !isSoftDeleted(item));
          const statuses = requestStatusesRes.data || [];
          const localStatusById = new Map(
            statuses.map((item) => [String(item.id), item.name])
          );

          const activeDomains = domains.filter(isActiveDomain);
          const expiringDomains = domains.filter((domain) => isExpiringInDays(domain, 30));
          const openRequests = requests.filter((request) =>
            isOpenRequest(request, localStatusById)
          );

          setSummary({
            activeDomains: activeDomains.length,
            expiringDomains: expiringDomains.length,
            openRequests: openRequests.length,
            expiredDomains: 0,
          });

          setUrgentDomains(expiringDomains);
          setLatestRequests(sortByDateDesc(latestRequestsRes.data || []).slice(0, 5));
          setRequestTypes(requestTypesRes.data || []);
          setRequestStatuses(statuses);
        }
      } catch (error) {
        const message =
          error?.response?.data?.detail ||
          "Не удалось загрузить данные дашборда";
        setSnackbar({ open: true, message });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isManager]);

  const handleCreateRequest = (domainId) => {
    const target = isManager ? "/requests" : "/my-requests";
    navigate(`${target}?create=1&domain_id=${domainId}`);
  };

  const handleGoToRequest = (requestId) => {
    const target = isManager ? "/requests" : "/my-requests";
    navigate(`${target}?request_id=${requestId}`);
  };

  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const managerCards = [
    { title: "Всего активных доменов", value: summary.activeDomains },
    { title: "Истекает в ближайшие 30 дней", value: summary.expiringDomains },
    { title: "Открытые заявки", value: summary.openRequests },
    { title: "Просроченные домены", value: summary.expiredDomains },
  ];

  const clientCards = [
    { title: "Мои активные домены", value: summary.activeDomains },
    { title: "Мои истекающие домены (30 дней)", value: summary.expiringDomains },
    { title: "Мои открытые заявки", value: summary.openRequests },
  ];

  if (loading) {
    return <Loader />;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Дашборд
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {(isManager ? managerCards : clientCards).map((card) => (
          <Grid
            item
            key={card.title}
            xs={12}
            sm={6}
            md={isManager ? 3 : 4}
          >
            <Card
              elevation={3}
              sx={{
                height: "100%",
                borderRadius: 2,
                boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
              }}
            >
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {card.title}
                </Typography>
                <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: "grid", gap: 3 }}>
        <Paper
          elevation={2}
          sx={{ p: 2, borderRadius: 2, boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)" }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {isManager
              ? "Срочные домены (до 7 дней)"
              : "Мои домены с истекающим сроком (30 дней)"}
          </Typography>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>Имя домена</th>
                <th style={cellStyle}>Дата окончания</th>
                {isManager && <th style={cellStyle}>Клиент</th>}
                {!isManager && <th style={cellStyle}>Дней до окончания</th>}
                <th style={rightCellStyle}>Действие</th>
              </tr>
            </thead>
            <tbody>
              {urgentDomains.length === 0 ? (
                <tr>
                  <td style={centerCellStyle} colSpan={4}>
                    Данные отсутствуют
                  </td>
                </tr>
              ) : (
                urgentDomains.map((domain) => {
                  const daysLeft = getDaysLeft(domain.expiration_date);
                  return (
                    <tr key={domain.id}>
                      <td style={cellStyle}>{domain.domain_name || "—"}</td>
                      <td style={cellStyle}>{formatDate(domain.expiration_date)}</td>
                      {isManager && (
                        <td style={cellStyle}>
                          {domain?.contract?.client?.name ||
                            domain?.client?.name ||
                            "—"}
                        </td>
                      )}
                      {!isManager && (
                        <td style={cellStyle}>
                          {daysLeft === null
                            ? "—"
                            : daysLeft < 0
                              ? `Просрочен (${Math.abs(daysLeft)} дн.)`
                              : `${daysLeft} дн.`}
                        </td>
                      )}
                      <td style={rightCellStyle}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleCreateRequest(domain.id)}
                        >
                          Создать заявку
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Paper>

        <Paper
          elevation={2}
          sx={{ p: 2, borderRadius: 2, boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)" }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {isManager ? "Последние 5 заявок" : "Мои последние 5 заявок"}
          </Typography>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>Номер заявки</th>
                <th style={cellStyle}>Тип</th>
                <th style={cellStyle}>Статус</th>
                {isManager ? (
                  <th style={cellStyle}>Инженер</th>
                ) : (
                  <th style={cellStyle}>Дата</th>
                )}
                <th style={rightCellStyle}>Действие</th>
              </tr>
            </thead>
            <tbody>
              {latestRequests.length === 0 ? (
                <tr>
                  <td style={centerCellStyle} colSpan={5}>
                    Данные отсутствуют
                  </td>
                </tr>
              ) : (
                latestRequests.map((request) => {
                  const typeName =
                    request?.request_type?.name ||
                    requestTypeById.get(String(request.request_type_id)) ||
                    `Тип #${request.request_type_id}`;

                  const statusName =
                    request?.execution_status?.name ||
                    requestStatusById.get(String(request.execution_status_id)) ||
                    `Статус #${request.execution_status_id}`;

                  return (
                    <tr key={request.id}>
                      <td style={cellStyle}>{request.request_number || `#${request.id}`}</td>
                      <td style={cellStyle}>{typeName}</td>
                      <td style={cellStyle}>{statusName}</td>
                      {isManager ? (
                        <td style={cellStyle}>{request.assigned_engineer_id || "—"}</td>
                      ) : (
                        <td style={cellStyle}>{formatDate(request.created_at)}</td>
                      )}
                      <td style={rightCellStyle}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleGoToRequest(request.id)}
                        >
                          Перейти
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Paper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={closeSnackbar} severity="error" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DashboardPage;

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
};

const cellStyle = {
  border: "1px solid #e5e7eb",
  padding: "12px",
  textAlign: "left",
  verticalAlign: "top",
};

const rightCellStyle = {
  ...cellStyle,
  textAlign: "right",
};

const centerCellStyle = {
  ...cellStyle,
  textAlign: "center",
};
