import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Results from "./pages/Results";
import CityPage from "./pages/CityPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
