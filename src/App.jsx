import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import LoginPage from "./pages/login/LoginPage";
import RegistrationTypePage from "./pages/registrationType/RegistrationTypePage";
import StudentRegistrationPage from "./pages/studentRegistration/StudentRegistrationPage";
import TeacherDashboardPage from "./pages/teacherDashboard/TeacherDashboardPage";

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
      <Route
        path="/teacher-registration"
        element={<TeacherDashboardPage />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
