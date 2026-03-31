import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox
} from "@mui/material";

const empty = {
  title: "",
  details: "",
  priority: "medium",
  dueDate: "",
  isPublic: false,
  isCompleted: false
};

const TodoDialog = ({ open, mode, initial, onCancel, onSave }) => {
  const [form, setForm] = React.useState(empty);

  React.useEffect(() => {
    if (open) setForm(initial ? { ...empty, ...initial } : empty);
  }, [open, initial]);

  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const onSubmit = (e) => {
    e.preventDefault();
    onSave({
      title: form.title,
      details: form.details || "",
      priority: form.priority,
      dueDate: form.dueDate || null,
      isPublic: !!form.isPublic,
      isCompleted: !!form.isCompleted
    });
  };

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
      <form onSubmit={onSubmit}>
        <DialogTitle>{mode === "edit" ? "Edit Todo" : "Create Todo"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              inputProps={{ "data-cy": "todo-title" }}
            />
            <TextField
              label="Details"
              value={form.details}
              onChange={(e) => set("details", e.target.value)}
              multiline
              minRows={3}
              inputProps={{ "data-cy": "todo-details" }}
            />
            <FormControl>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                label="Priority"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                data-cy="todo-priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Due date"
              type="date"
              value={form.dueDate || ""}
              onChange={(e) => set("dueDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ "data-cy": "todo-dueDate" }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.isPublic}
                  onChange={(e) => set("isPublic", e.target.checked)}
                  inputProps={{ "data-cy": "todo-isPublic" }}
                />
              }
              label="Public (visible to guests)"
            />

            {mode === "edit" ? (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!form.isCompleted}
                    onChange={(e) => set("isCompleted", e.target.checked)}
                    inputProps={{ "data-cy": "todo-isCompleted" }}
                  />
                }
                label="Completed"
              />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} data-cy="todo-cancel">Cancel</Button>
          <Button type="submit" variant="contained" data-cy="todo-save">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TodoDialog;
