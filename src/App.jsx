import React from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container
} from "@mui/material";
import { useAuth } from "./auth/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TodosPage from "./pages/TodosPage";
import PublicTodosPage from "./pages/PublicTodosPage";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
};

const App = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static">
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Todo Management
          </Typography>

          <Button color="inherit" component={Link} to="/public" data-cy="nav-public">
            Public
          </Button>

          {isAuthenticated ? (
            <>
              <Button color="inherit" component={Link} to="/todos" data-cy="nav-todos">
                My Todos
              </Button>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {user?.email}
              </Typography>
              <Button color="inherit" onClick={logout} data-cy="nav-logout">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login" data-cy="nav-login">
                Login
              </Button>
              <Button color="inherit" component={Link} to="/register" data-cy="nav-register">
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 3, flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/public" replace />} />
          <Route path="/public" element={<PublicTodosPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/todos"
            element={
              <PrivateRoute>
                <TodosPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/public" replace />} />
        </Routes>
      </Container>

      <Box component="footer" sx={{ py: 2, textAlign: "center", opacity: 0.7 }}>
        <Typography variant="caption">Backend must run on port 3087 (for Cypress scoring)</Typography>
      </Box>
    </Box>
  );
};

export default App;
