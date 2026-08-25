import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import FuzzyDashboard from "./components/FuzzyDashboard";
import Navbar from "./components/Navbar";
import ReportDashboard from "./components/ReportDashboard";
import { MainJsonProvider } from "./contexts/MainJsonContext";
import LandingPage from "./LandingPage";
import AboutUs from "./pages/AboutUs";
import Footer from "./pages/Footer";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Wizard from "./pages/Wizard";
import { globalTheme } from "./theme/index";
import "./styles.css";

export default function App() {
  return (
    <ThemeProvider theme={globalTheme}>
      <CssBaseline />
      <MainJsonProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/simulation" element={<Wizard />} />
            <Route path="/dashboard" element={<FuzzyDashboard />} />
            <Route path="/report-dashboard" element={<ReportDashboard />} />
            <Route path="/aboutus" element={<AboutUs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </Router>
      </MainJsonProvider>
    </ThemeProvider>
  );
}
