import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Dpo from "./pages/Dpo";
import User from "./pages/User";
import RequireAuth from "./auth/RequireAuth";
import AdminLayout from "./layouts/AdminLayout";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route element={<RequireAuth roles={["ADMIN"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Admin />} />
          {/* placeholders for sidebar routes */}
          <Route path="/admin/gap" element={<Admin />} />
          <Route path="/admin/dpia" element={<Admin />} />
          <Route path="/admin/ropa" element={<Admin />} />
          <Route path="/admin/incidents" element={<Admin />} />
          <Route path="/admin/policies" element={<Admin />} />
          <Route path="/admin/training" element={<Admin />} />
          <Route path="/admin/users" element={<Admin />} />
        </Route>
      </Route>

      <Route element={<RequireAuth roles={["DPO"]} />}>
        <Route path="/dpo" element={<Dpo />} />
      </Route>

      <Route element={<RequireAuth roles={["USER"]} />}>
        <Route path="/user" element={<User />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
