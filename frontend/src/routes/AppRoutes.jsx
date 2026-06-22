import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import DashboardLayout from '../layouts/DashboardLayout'

// Landing
import LandingPage from '../pages/LandingPage'

// Auth
import Login    from '../pages/auth/Login'

// Admin Panel
import AdminPanel from '../pages/admin/AdminPanel'

// Dashboard
import Dashboard from '../pages/dashboard/Dashboard'

// Students
import StudentList    from '../pages/students/StudentList'
import AddStudent     from '../pages/students/AddStudent'
import EditStudent    from '../pages/students/EditStudent'
import StudentProfile from '../pages/students/StudentProfile'
import MyProfile      from '../pages/students/MyProfile'

// Faculty
import FacultyList    from '../pages/faculty/FacultyList'
import AddFaculty     from '../pages/faculty/AddFaculty'
import EditFaculty    from '../pages/faculty/EditFaculty'
import FacultyProfile from '../pages/faculty/FacultyProfile'

// HR & Payroll
import EmployeeList        from '../pages/hr/EmployeeList'
import EmployeeForm        from '../pages/hr/EmployeeForm'
import EmployeeProfile     from '../pages/hr/EmployeeProfile'
import AttendanceManagement from '../pages/hr/AttendanceManagement'
import LeaveRequests       from '../pages/hr/LeaveRequests'
import PayrollProcessing   from '../pages/hr/PayrollProcessing'
import Payslip             from '../pages/hr/Payslip'
import HRReports           from '../pages/hr/HRReports'

// Attendance (Student)
import AttendanceModule from '../pages/attendance/AttendanceModule'

// Academics
import AcademicsModule from '../pages/academics/AcademicsModule'

// Timetable
import TimetableModule from '../pages/timetable/TimetableModule'

// Examination
import ExaminationModule from '../pages/examination/ExaminationModule'

// Fees
import EditFee       from '../pages/fees/EditFee'
import FeeList      from '../pages/fees/FeeList'
import AddFee       from '../pages/fees/AddFee'
import PaymentHistory from '../pages/fees/PaymentHistory'
import FeeStructure from '../pages/fees/FeeStructure'
import StudentPayFee from '../pages/fees/StudentPayFee'
import ParentPortal from '../pages/fees/ParentPortal'

// Library
import LibraryModule from '../pages/library/LibraryModule'

// Hostel
import HostelDashboard   from '../pages/hostel/HostelDashboard'
import HostelApplications from '../pages/hostel/HostelApplications'
import HostelRooms       from '../pages/hostel/HostelRooms'
import HostelAllotments  from '../pages/hostel/HostelAllotments'
import HostelAttendance  from '../pages/hostel/HostelAttendance'
import HostelFees        from '../pages/hostel/HostelFees'
import HostelLeaves      from '../pages/hostel/HostelLeaves'
import HostelVisitors    from '../pages/hostel/HostelVisitors'
import HostelComplaints  from '../pages/hostel/HostelComplaints'
import HostelReports     from '../pages/hostel/HostelReports'

// Transport
import TransportModule from '../pages/transport/TransportModule'

// Placement
import PlacementModule from '../pages/placement/PlacementModule'

// Alumni
import AlumniModule from '../pages/alumni/AlumniModule'

// Notifications
import NotificationsModule from '../pages/notifications/NotificationsModule'

// Reports
import ReportsAnalytics from '../pages/reports/ReportsAnalytics'

// Users
import UserManagement from '../pages/users/UserManagement'

// Settings
import SettingsModule from '../pages/settings/SettingsModule'

import NotFound from '../pages/NotFound'

// ── Role groups ──────────────────────────────────────────────────────────────
const SUPER    = ['super_admin']
const ADMIN    = ['super_admin', 'admin']
const HR       = ['super_admin', 'admin', 'hr']
const FINANCE  = ['super_admin', 'admin', 'accountant']
const ACADEMIC = ['super_admin', 'admin', 'faculty']
const HOSTEL   = ['super_admin', 'admin', 'hostel_warden']
const LIBRARY  = ['super_admin', 'admin', 'librarian']
const PLACE    = ['super_admin', 'admin', 'placement_officer']
const TRANS    = ['super_admin', 'admin', 'transport_incharge']
const ALUMNI   = ['super_admin', 'admin', 'alumni_coordinator']
const ALL_STAFF = [...new Set([...ADMIN, ...HR, ...FINANCE, ...ACADEMIC, ...HOSTEL, ...LIBRARY, ...PLACE, ...TRANS, ...ALUMNI])]

const R = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Landing & Authentication ── */}
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>

          {/* ── Super Admin / Admin Panel ── */}
          <Route path="/admin-panel" element={R(ADMIN, <AdminPanel />)} />

          {/* ── Dashboard Module ── */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* ── Student self-service ── */}
          <Route path="/my-profile" element={R(['student'], <MyProfile />)} />
          <Route path="/fees/pay"   element={R(['student'], <StudentPayFee />)} />
          <Route path="/parent-portal" element={R(['parent'], <ParentPortal />)} />

          {/* ── Student Management Module ── */}
          <Route path="/students"          element={R(ACADEMIC, <StudentList />)} />
          <Route path="/students/add"      element={R(ADMIN,    <AddStudent />)} />
          <Route path="/students/:id/edit" element={R(ADMIN,    <EditStudent />)} />
          <Route path="/students/:id"      element={R(ACADEMIC, <StudentProfile />)} />

          {/* ── Faculty Management Module ── */}
          <Route path="/faculty"          element={R(HR, <FacultyList />)} />
          <Route path="/faculty/add"      element={R(HR, <AddFaculty />)} />
          <Route path="/faculty/:id/edit" element={R(HR, <EditFaculty />)} />
          <Route path="/faculty/:id"      element={R([...HR, 'faculty'], <FacultyProfile />)} />

          {/* ── HR & Payroll Module ── */}
          <Route path="/hr/employees"          element={R(HR, <EmployeeList />)} />
          <Route path="/hr/employees/add"      element={R(HR, <EmployeeForm />)} />
          <Route path="/hr/employees/:id/edit" element={R(HR, <EmployeeForm />)} />
          <Route path="/hr/employees/:id"      element={R(HR, <EmployeeProfile />)} />
          <Route path="/hr/attendance"         element={R(HR, <AttendanceManagement />)} />
          <Route path="/hr/leaves"             element={R(HR, <LeaveRequests />)} />
          <Route path="/hr/payroll"            element={R(HR, <PayrollProcessing />)} />
          <Route path="/hr/payslip/:id"        element={R(HR, <Payslip />)} />
          <Route path="/hr/reports"            element={R(HR, <HRReports />)} />

          {/* ── Attendance Module (Student) ── */}
          <Route path="/attendance" element={R(ACADEMIC, <AttendanceModule />)} />

          {/* ── Academic Module ── */}
          <Route path="/academics" element={R(ACADEMIC, <AcademicsModule />)} />

          {/* ── Timetable Module ── */}
          <Route path="/timetable" element={R(ACADEMIC, <TimetableModule />)} />

          {/* ── Examination Module ── */}
          <Route path="/examination" element={R(ACADEMIC, <ExaminationModule />)} />

          {/* ── Fee Management Module ── */}
          <Route path="/fees"           element={R([...FINANCE, 'student'], <FeeList />)} />
          <Route path="/fees/add"       element={R(FINANCE, <AddFee />)} />
          <Route path="/fees/:id/edit"  element={R(FINANCE, <EditFee />)} />
          <Route path="/fees/structure" element={R([...FINANCE, 'student'], <FeeStructure />)} />
          <Route path="/fees/history"   element={R(FINANCE, <PaymentHistory />)} />

          {/* ── Library Management Module ── */}
          <Route path="/library" element={R(LIBRARY, <LibraryModule />)} />

          {/* ── Hostel Management Module ── */}
          <Route path="/hostel"              element={R(HOSTEL, <HostelDashboard />)} />
          <Route path="/hostel/applications" element={R(HOSTEL, <HostelApplications />)} />
          <Route path="/hostel/rooms"        element={R(HOSTEL, <HostelRooms />)} />
          <Route path="/hostel/allotments"   element={R(HOSTEL, <HostelAllotments />)} />
          <Route path="/hostel/attendance"   element={R(HOSTEL, <HostelAttendance />)} />
          <Route path="/hostel/fees"         element={R(HOSTEL, <HostelFees />)} />
          <Route path="/hostel/leaves"       element={R(HOSTEL, <HostelLeaves />)} />
          <Route path="/hostel/visitors"     element={R(HOSTEL, <HostelVisitors />)} />
          <Route path="/hostel/complaints"   element={R(HOSTEL, <HostelComplaints />)} />
          <Route path="/hostel/reports"      element={R(HOSTEL, <HostelReports />)} />

          {/* ── Transport Management Module ── */}
          <Route path="/transport" element={R(TRANS, <TransportModule />)} />

          {/* ── Placement Management Module ── */}
          <Route path="/placement" element={R(PLACE, <PlacementModule />)} />

          {/* ── Alumni Management Module ── */}
          <Route path="/alumni" element={R(ALUMNI, <AlumniModule />)} />

          {/* ── User Management Module ── */}
          <Route path="/users" element={R(ADMIN, <UserManagement />)} />

          {/* ── Notification Module ── */}
          <Route path="/notifications" element={R(ADMIN, <NotificationsModule />)} />

          {/* ── Reports & Analytics Module ── */}
          <Route path="/reports" element={R(ADMIN, <ReportsAnalytics />)} />

          {/* ── Settings & Access Control Module ── */}
          <Route path="/settings" element={R(SUPER, <SettingsModule />)} />

        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
