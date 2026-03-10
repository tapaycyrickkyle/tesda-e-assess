import React from "react";
import StudentRegistrationPage from "./pages/studentRegistration/StudentRegistrationPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const App = () => {
  return (
    <>
      <Navbar />
      <StudentRegistrationPage />
      <Footer />
    </>
  );
};

export default App;
