import React from "react";
import {
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Pagination
} from "@mui/material";
import { api, isApiError } from "../api/client";
import TodoFilters from "../components/TodoFilters";

const PublicTodosPage = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [data, setData] = React.useState({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });

  const [filters, setFilters] = React.useState({
    search: "",
    status: "all",
    priority: "",
    sortBy: "createdAt",
    sortDir: "asc"
  });

  const fetchList = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        pageSize: data.pageSize,
        search: filters.search || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir
      };
      const res = await api.get("/api/todos/public", { params });
      setData(res.data);
    } catch (err) {
      if (isApiError(err)) setError(err.response?.data?.title || "Failed to load public todos");
      else setError("Failed to load public todos");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchList(1); /* eslint-disable-line */ }, []);

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Public Todos</Typography>
      <TodoFilters value={filters} onChange={setFilters} onApply={() => fetchList(1)} />

      {error ? <Alert severity="error" data-cy="public-error">{error}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        {loading ? <CircularProgress /> : (
          <>
            <Table size="small" data-cy="public-table">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Due</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((t) => (
                  <TableRow key={t.id} data-cy={`public-row-${t.id}`}>
                    <TableCell>{t.title}</TableCell>
                    <TableCell>{t.priority}</TableCell>
                    <TableCell>{t.dueDate || "-"}</TableCell>
                    <TableCell>{t.isCompleted ? "completed" : "active"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
              <Pagination
                count={data.totalPages || 1}
                page={data.page || 1}
                onChange={(_, p) => fetchList(p)}
                data-cy="public-pagination"
              />
            </Stack>
          </>
        )}
      </Paper>
    </Stack>
  );
};

export default PublicTodosPage;
