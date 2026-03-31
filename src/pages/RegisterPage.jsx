import React from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Link
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { isApiError } from "../api/client";

const RegisterPage = () => {
  const { register } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(email, password, displayName);
      nav("/todos", { replace: true });
    } catch (err) {
      if (isApiError(err)) setError(err.response?.data?.title || "Registration failed");
      else setError("Registration failed");
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 520, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Register
      </Typography>

      {error ? <Alert severity="error" sx={{ mb: 2 }} data-cy="register-error">{error}</Alert> : null}

      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            inputProps={{ "data-cy": "register-email" }}
          />
          <TextField
            label="Display name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            inputProps={{ "data-cy": "register-displayName" }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helperText="Min 6 characters"
            inputProps={{ "data-cy": "register-password" }}
          />
          <Button type="submit" variant="contained" data-cy="register-submit">
            Create account
          </Button>
          <Typography variant="body2">
            Already have an account?{" "}
            <Link component={RouterLink} to="/login">
              Login
            </Link>
          </Typography>
        </Stack>
      </form>
    </Paper>
  );
};

export default RegisterPage;
