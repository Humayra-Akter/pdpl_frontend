import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Dpo from "./pages/Dpo";
import User from "./pages/User";
import RequireAuth from "./auth/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route element={<RequireAuth roles={["ADMIN"]} />}>
        <Route path="/admin" element={<Admin />} />
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
