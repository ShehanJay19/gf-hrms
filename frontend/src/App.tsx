import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './app/AuthContext';
import RequireAuth from './app/RequireAuth';
import RequireRole from './app/RequireRole';
import AppShell from './app/AppShell';
import { HR_MANAGER_ROLES, PAYROLL_ROLES } from './lib/roles';

import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import EmployeeListPage from './features/employees/EmployeeListPage';
import EmployeeDetailPage from './features/employees/EmployeeDetailPage';
import EmployeeFormPage from './features/employees/EmployeeFormPage';
import AttendanceDailyPage from './features/attendance/AttendanceDailyPage';
import AttendanceMonthlyPage from './features/attendance/AttendanceMonthlyPage';
import LeavesPage from './features/leaves/LeavesPage';
import PayrollRunsPage from './features/payroll/PayrollRunsPage';
import PayrollRunFormPage from './features/payroll/PayrollRunFormPage';
import PayrollRunDetailPage from './features/payroll/PayrollRunDetailPage';
import PayslipPage from './features/payroll/PayslipPage';
import ReportsPage from './features/reports/ReportsPage';
import ExportsPage from './features/exports/ExportsPage';
import OrgSettingsPage from './features/settings/OrgSettingsPage';
import AccountPage from './features/account/AccountPage';
import CreateUserPage from './features/account/CreateUserPage';
import NotFoundPage from './features/misc/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />

              <Route path="employees" element={<EmployeeListPage />} />
              <Route path="employees/:id" element={<EmployeeDetailPage />} />
              <Route element={<RequireRole allow={HR_MANAGER_ROLES} />}>
                <Route path="employees/new" element={<EmployeeFormPage mode="create" />} />
                <Route path="employees/:id/edit" element={<EmployeeFormPage mode="edit" />} />
              </Route>

              <Route path="attendance" element={<AttendanceDailyPage />} />
              <Route element={<RequireRole allow={HR_MANAGER_ROLES} />}>
                <Route path="attendance/monthly" element={<AttendanceMonthlyPage />} />
              </Route>

              <Route path="leaves" element={<LeavesPage />} />

              <Route element={<RequireRole allow={HR_MANAGER_ROLES} />}>
                <Route path="payroll/runs" element={<PayrollRunsPage />} />
                <Route path="payroll/runs/:id" element={<PayrollRunDetailPage />} />
              </Route>
              <Route element={<RequireRole allow={PAYROLL_ROLES} />}>
                <Route path="payroll/runs/new" element={<PayrollRunFormPage />} />
              </Route>
              <Route path="payroll/runs/:id/payslips/:employeeId" element={<PayslipPage />} />

              <Route element={<RequireRole allow={HR_MANAGER_ROLES} />}>
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<OrgSettingsPage />} />
              </Route>

              <Route path="exports" element={<ExportsPage />} />

              <Route path="account" element={<AccountPage />} />
              <Route element={<RequireRole allow={HR_MANAGER_ROLES} />}>
                <Route path="account/users/new" element={<CreateUserPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
