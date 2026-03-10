import React from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./pages/landing/LandingPage";

const App = () => {
  return (
    <>
      <Navbar />
      <LandingPage />
      <Footer />
    </>
  );
};

export default App;
