import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Results from "./pages/Results";
import CityPage from "./pages/CityPage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/city/:cityName" element={<CityPage />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
