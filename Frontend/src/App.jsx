import PatientLayout from "./pages/patient/PatientLayout";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientProfile from "./pages/patient/PatientProfile";
import VitalMonitor from "./pages/patient/VitalMonitor";
import MedicalRecords from "./pages/patient/MedicalRecords";
import PrescriptionVault from "./pages/patient/PrescriptionVault";
import Medicines from "./pages/patient/Medicines";
import Appointments from "./pages/patient/Appointments";
import EmergencyProfile from "./pages/patient/Emergency";
import MediTrackAI from "./pages/patient/MediTrackAI";
import HealthTimeline from "./pages/patient/HealthTimeline";
import HealthAssessment from "./pages/patient/HealthAssessment";
import Settings from "./pages/patient/Settings";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import RoleSelection from "./pages/auth/RoleSelection";
import Login from "./pages/auth/Login";
import PatientRegister from "./pages/auth/PatientRegister";
import DoctorLayout from "./pages/doctor/DoctorLayout";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorSchedule from "./pages/doctor/DoctorSchedule";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import DoctorRegister from "./pages/auth/DoctorRegister";
import AdminVerification from "./pages/doctor/AdminVerification";

function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* =====================================================
            PUBLIC
            ===================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/auth/roles"
              replace
            />
          }
        />

        <Route
          path="/auth/roles"
          element={
            <RoleSelection />
          }
        />

        {/* =====================================================
            AUTHENTICATION
            ===================================================== */}

        <Route
          path="/login/:role"
          element={
            <Login />
          }
        />

        <Route
          path="/register/patient"
          element={<PatientRegister />}
        />

        <Route
          path="/register/doctor"
          element={<DoctorRegister />}
        />

        {/* =====================================================
            PATIENT PORTAL
            ===================================================== */}

        <Route
  path="/patient"
  element={<PatientLayout />}
>
  <Route
    index
    element={<PatientDashboard />}
  />

  <Route
  path="health"
  element={<VitalMonitor />}
/>

  <Route
  path="records"
  element={<MedicalRecords />}
/>

  <Route
  path="prescriptions"
  element={<PrescriptionVault />}
/>

  <Route
    path="medicines"
    element={<Medicines />}
  />

  <Route
  path="appointments"
  element={<Appointments />}
/>

  <Route path="ai-insight" element={<MediTrackAI />} />

  <Route path="timeline" element={<HealthTimeline />} />

  <Route path="assessment" element={<HealthAssessment />} />

  <Route
  path="emergency"
  element={<EmergencyProfile />}
/>

  <Route
  path="profile"
  element={<PatientProfile />}
/>

  <Route path="settings" element={<Settings />} />
</Route>
        {/* =====================================================
            DOCTOR PORTAL
            ===================================================== */}

        <Route
          path="/doctor"
          element={<DoctorLayout />}
        >
          <Route index element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="schedule" element={<DoctorSchedule />} />
          <Route path="profile" element={<DoctorProfile />} />
        </Route>

        {/* =====================================================
            ADMIN PORTAL
            ===================================================== */}

        <Route
          path="/admin"
          element={<AdminVerification />}
        />

        {/* =====================================================
            UNKNOWN ROUTES
            ===================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/auth/roles"
              replace
            />
          }
        />

      </Routes>
    </AuthProvider>
  );
}

function TemporaryPatientPage({ title }) {
  return (
    <div className="temporary-page">
      <h1>{title}</h1>
      <p>This MediTrack module is being developed next.</p>
    </div>
  );
}

export default App;