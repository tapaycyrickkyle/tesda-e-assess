import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import LoginPage from "./pages/login/LoginPage";
import RegistrationTypePage from "./pages/registrationType/RegistrationTypePage";
import StudentRegistrationPage from "./pages/studentRegistration/StudentRegistrationPage";
import TeacherDashboardPage from "./pages/teacherDashboard/TeacherDashboardPage";
import SecretaryDashboardPage from "./pages/secretaryDashboard/SecretaryDashboardPage";
import StudentDashboardPage from "./pages/studentDashboard/StudentDashboardPage";
import DirectorDashboardPage from "./pages/directorDashboard/DirectorDashboardPage";
import AssessmentCenterDashboardPage from "./pages/assessmentCenterDashboard/AssessmentCenterDashboardPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registration-type" element={<RegistrationTypePage />} />
      <Route
        path="/applicant-registration"
        element={<StudentRegistrationPage />}
      />
      <Route path="/teacher-registration" element={<TeacherDashboardPage />} />
      <Route path="/secretary-dashboard" element={<SecretaryDashboardPage />} />
      <Route
        path="/secretary"
        element={<Navigate to="/secretary-dashboard" replace />}
      />
      <Route path="/director-dashboard" element={<DirectorDashboardPage />} />
      <Route
        path="/director"
        element={<Navigate to="/director-dashboard" replace />}
      />
      <Route
        path="/assessment-center-dashboard"
        element={<AssessmentCenterDashboardPage />}
      />
      <Route
        path="/assessment-center"
        element={<Navigate to="/assessment-center-dashboard" replace />}
      />
      <Route path="/student-dashboard" element={<StudentDashboardPage />} />
      <Route
        path="/student"
        element={<Navigate to="/student-dashboard" replace />}
      />
      <Route
        path="/applicant-dashboard"
        element={<Navigate to="/student-dashboard" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
