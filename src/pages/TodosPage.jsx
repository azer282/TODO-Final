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
  Pagination,
  IconButton,
  Button,
  Chip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { api, isApiError } from "../api/client";
import TodoDialog from "../components/TodoDialog";
import TodoFilters from "../components/TodoFilters";

const TodosPage = () => {
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

  const [dialog, setDialog] = React.useState({ open: false, mode: "create", todo: null });

  const getTotalPages = (totalItems, pageSize) => Math.max(1, Math.ceil(totalItems / pageSize));

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
      const res = await api.get("/api/todos", { params });
      setData(res.data);
    } catch (err) {
      if (isApiError(err)) setError(err.response?.data?.title || "Failed to load todos");
      else setError("Failed to load todos");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchList(1); /* eslint-disable-line */ }, []);

  const openCreate = () => setDialog({ open: true, mode: "create", todo: null });
  const openEdit = (t) => setDialog({ open: true, mode: "edit", todo: t });
  const closeDialog = () => setDialog((p) => ({ ...p, open: false }));

  const saveTodo = async (payload) => {
    try {
      if (dialog.mode === "create") {
        const { data: created } = await api.post("/api/todos", payload);
        setData((prev) => {
          const totalItems = prev.totalItems + 1;
          const items = [created, ...prev.items].slice(0, prev.pageSize);
          return {
            ...prev,
            items,
            page: 1,
            totalItems,
            totalPages: getTotalPages(totalItems, prev.pageSize)
          };
        });
      } else {
        const { data: updated } = await api.put(`/api/todos/${dialog.todo.id}`, payload);
        setData((prev) => ({
          ...prev,
          items: prev.items.map((item) => (item.id === updated.id ? updated : item))
        }));
      }
      closeDialog();
    } catch (err) {
      if (isApiError(err)) setError(err.response?.data?.title || "Save failed");
      else setError("Save failed");
    }
  };

  const toggleCompletion = async (t) => {
    try {
      const { data: updated } = await api.patch(`/api/todos/${t.id}/completion`, { isCompleted: !t.isCompleted });
      setData((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === updated.id ? updated : item))
      }));
    } catch (err) {
      if (isApiError(err)) setError(err.response?.data?.title || "Update failed");
      else setError("Update failed");
    }
  };

  const deleteTodo = async (t) => {
    if (!confirm(`Delete "${t.title}"?`)) return;
    try {
      await api.delete(`/api/todos/${t.id}`);
      setData((prev) => {
        const totalItems = Math.max(0, prev.totalItems - 1);
        return {
          ...prev,
          items: prev.items.filter((item) => item.id !== t.id),
          totalItems,
          totalPages: getTotalPages(totalItems, prev.pageSize)
        };
      });
    } catch (err) {
      if (isApiError(err)) setError(err.response?.data?.title || "Delete failed");
      else setError("Delete failed");
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">My Todos</Typography>
        <Button variant="contained" onClick={openCreate} data-cy="todo-create">
          Create
        </Button>
      </Stack>

      <TodoFilters value={filters} onChange={setFilters} onApply={() => fetchList(1)} />

      {error ? <Alert severity="error" data-cy="todos-error">{error}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        {loading ? <CircularProgress /> : (
          <>
            <Table size="small" data-cy="todos-table">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Due</TableCell>
                  <TableCell>Public</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((t) => (
                  <TableRow key={t.id} data-cy={`todo-row-${t.id}`}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2">{t.title}</Typography>
                        {t.isCompleted ? <Chip size="small" label="done" /> : null}
                      </Stack>
                    </TableCell>
                    <TableCell>{t.priority}</TableCell>
                    <TableCell>{t.dueDate || "-"}</TableCell>
                    <TableCell>{t.isPublic ? "yes" : "no"}</TableCell>
                    <TableCell>{t.isCompleted ? "completed" : "active"}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => toggleCompletion(t)} size="small" data-cy={`todo-toggle-${t.id}`}>
                        {t.isCompleted ? <RadioButtonUncheckedIcon /> : <CheckCircleIcon />}
                      </IconButton>
                      <IconButton onClick={() => openEdit(t)} size="small" data-cy={`todo-edit-${t.id}`}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => deleteTodo(t)} size="small" data-cy={`todo-delete-${t.id}`}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
              <Pagination
                count={data.totalPages || 1}
                page={data.page || 1}
                onChange={(_, p) => fetchList(p)}
                data-cy="todos-pagination"
              />
            </Stack>
          </>
        )}
      </Paper>

      <TodoDialog
        open={dialog.open}
        mode={dialog.mode}
        initial={dialog.todo}
        onCancel={closeDialog}
        onSave={saveTodo}
      />
    </Stack>
  );
};

export default TodosPage;
