import React from "react";
import {
  Paper,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from "@mui/material";

const TodoFilters = ({ value, onChange, onApply }) => {
  const set = (key, v) => onChange({ ...value, [key]: v });

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack spacing={2} direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }}>
        <TextField
          label="Search"
          value={value.search}
          onChange={(e) => set("search", e.target.value)}
          inputProps={{ "data-cy": "filter-search" }}
          sx={{ flex: 1 }}
        />

        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            label="Status"
            value={value.status}
            onChange={(e) => set("status", e.target.value)}
            data-cy="filter-status"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel id="priority-label">Priority</InputLabel>
          <Select
            labelId="priority-label"
            label="Priority"
            value={value.priority}
            onChange={(e) => set("priority", e.target.value)}
            data-cy="filter-priority"
          >
            <MenuItem value="">(any)</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel id="sortBy-label">Sort by</InputLabel>
          <Select
            labelId="sortBy-label"
            label="Sort by"
            value={value.sortBy}
            onChange={(e) => set("sortBy", e.target.value)}
            data-cy="filter-sortBy"
          >
            <MenuItem value="createdAt">Created</MenuItem>
            <MenuItem value="dueDate">Due date</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
            <MenuItem value="title">Title</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 140 }}>
          <InputLabel id="sortDir-label">Direction</InputLabel>
          <Select
            labelId="sortDir-label"
            label="Direction"
            value={value.sortDir}
            onChange={(e) => set("sortDir", e.target.value)}
            data-cy="filter-sortDir"
          >
            <MenuItem value="desc">Desc</MenuItem>
            <MenuItem value="asc">Asc</MenuItem>
          </Select>
        </FormControl>

        <Button variant="outlined" onClick={onApply} data-cy="filter-apply">
          Apply
        </Button>
      </Stack>
    </Paper>
  );
};

export default TodoFilters;
