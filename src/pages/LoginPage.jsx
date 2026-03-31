import React from "react";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
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

const LoginPage = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/todos";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      nav(from, { replace: true });
    } catch (err) {
      if (isApiError(err)) setError(err.response?.data?.title || "Login failed");
      else setError("Login failed");
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 520, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Login
      </Typography>

      {error ? <Alert severity="error" sx={{ mb: 2 }} data-cy="login-error">{error}</Alert> : null}

      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            inputProps={{ "data-cy": "login-email" }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            inputProps={{ "data-cy": "login-password" }}
          />
          <Button type="submit" variant="contained" data-cy="login-submit">
            Sign in
          </Button>
          <Typography variant="body2">
            No account?{" "}
            <Link component={RouterLink} to="/register">
              Register
            </Link>
          </Typography>
        </Stack>
      </form>
    </Paper>
  );
};

export default LoginPage;
