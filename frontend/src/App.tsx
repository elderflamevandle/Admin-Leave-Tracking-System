import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";

// Auth pages
import LoginPage from "@/pages/auth/login";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import ResetPasswordPage from "@/pages/auth/reset-password";
import ChangePasswordPage from "@/pages/auth/change-password";

// Dashboard layout
import DashboardLayout from "@/pages/layout/dashboard-layout";

// Dashboard pages
import DashboardPage from "@/pages/dashboard";
import TimelogPage from "@/pages/timelog";
import AllTimelogsPage from "@/pages/timelog/all";
import LeavePage from "@/pages/leave";
import LeaveManagePage from "@/pages/leave/manage";
import LeaveCalendarPage from "@/pages/leave/calendar";
import ActivityPage from "@/pages/activity";
import AllActivityPage from "@/pages/activity/all";
import DirectoryPage from "@/pages/directory";
import EmployeeProfilePage from "@/pages/directory/[id]";
import ProfilePage from "@/pages/profile";

// Admin pages
import AdminUsersPage from "@/pages/admin/users";
import NewUserPage from "@/pages/admin/users/new";
import EditUserPage from "@/pages/admin/users/[id]";
import RolesPage from "@/pages/admin/roles";
import HolidaysPage from "@/pages/admin/holidays";
import ReportsPage from "@/pages/admin/reports";
import AuditLogPage from "@/pages/admin/audit";
import SettingsPage from "@/pages/admin/settings";

// Placeholder pages
import PlaceholderComingSoon from "@/pages/coming-soon";

function App() {
  return (
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />

            {/* Dashboard routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Timelog */}
              <Route path="/timelog" element={<TimelogPage />} />
              <Route path="/timelog/all" element={<AllTimelogsPage />} />

              {/* Leave */}
              <Route path="/leave" element={<LeavePage />} />
              <Route path="/leave/manage" element={<LeaveManagePage />} />
              <Route path="/leave/calendar" element={<LeaveCalendarPage />} />

              {/* Activity */}
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/activity/all" element={<AllActivityPage />} />

              {/* Directory */}
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/directory/:id" element={<EmployeeProfilePage />} />

              {/* Profile */}
              <Route path="/profile" element={<ProfilePage />} />

              {/* Admin */}
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/users/new" element={<NewUserPage />} />
              <Route path="/admin/users/:id" element={<EditUserPage />} />
              <Route path="/admin/roles" element={<RolesPage />} />
              <Route path="/admin/holidays" element={<HolidaysPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/audit" element={<AuditLogPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />

              {/* Coming soon placeholders */}
              <Route path="/pipeline" element={<PlaceholderComingSoon module="Pipeline" />} />
              <Route path="/outreach" element={<PlaceholderComingSoon module="Outreach" />} />
              <Route path="/research" element={<PlaceholderComingSoon module="Research" />} />
              <Route path="/legal" element={<PlaceholderComingSoon module="Legal Vault" />} />
              <Route path="/finance" element={<PlaceholderComingSoon module="Finance" />} />
              <Route path="/documents" element={<PlaceholderComingSoon module="Documents" />} />
              <Route path="/projects" element={<PlaceholderComingSoon module="Project Planner" />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster richColors />
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}

export default App;
