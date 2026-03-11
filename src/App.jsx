import React from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import TeacherDashboardPage from "./pages/teacherDashboard/TeacherDashboardPage";

const App = () => {
  return (
    <>
      <Navbar />
      <TeacherDashboardPage />
      <Footer />
    </>
  );
};

export default App;
