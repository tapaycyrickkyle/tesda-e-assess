import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import RegistrationTypePage from "./pages/registrationType/RegistrationTypePage";
import StudentRegistration from "./pages/studentRegistration/StudentRegistrationPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/registration-type" element={<RegistrationTypePage />} />
      <Route path="/applicant-registration" element={<StudentRegistration />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
