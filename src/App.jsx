import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Dpo from "./pages/Dpo";
import User from "./pages/User";
import RequireAuth from "./auth/RequireAuth";
import AdminLayout from "./layouts/AdminLayout";
import GapAssessment from "./pages/GapAssessment";
import GapAssessmentDetails from "./pages/GapAssessmentDetails";
import DpiaWizard from "./pages/DpiaWizard";
import DpiaList from "./pages/DpiaList";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      {/* <Route element={<RequireAuth roles={["ADMIN"]} />}> */}
      <Route element={<RequireAuth roles={["ADMIN", "DPO"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Admin />} />
          {/* GAP dynamic routes */}
          <Route path="/admin/gap" element={<GapAssessment />} />
          <Route path="/admin/gap/:id" element={<GapAssessmentDetails />} />

          {/* DPIA dynamic routes */}
          <Route path="/admin/dpia" element={<DpiaList />} />
          <Route path="/admin/dpia/:id" element={<DpiaWizard />} />

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
