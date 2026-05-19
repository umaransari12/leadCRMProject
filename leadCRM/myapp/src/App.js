import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "../src/fonts/fonts.css"
import "./common-styles/utilize.scss"
import SigninPage from "./pages/signinPage";
import SignupPage from "./pages/signupPage";
import DashboardPage from "./pages/dashboardPage";
import Leadpage from "./pages/leadpage";
import AddLeadPage from "./pages/addLeadPage";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <PublicRoute>
            <SigninPage />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/lead" element={
          <ProtectedRoute>
            <Leadpage />
          </ProtectedRoute>
        } />
        <Route path="/addlead" element={
          <ProtectedRoute>
            <AddLeadPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;