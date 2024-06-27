import { Provider } from 'react-redux';
import Home from './pages/HomePage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Simulation from './pages/SimulationPage';
//import Dashboard from './components/Dashboard'
import FuzzyDashboard from './components/FuzzyDashboard';
import ReportDashboard from './components/ReportDashboard';
import LandingPage from './pages/LandingPage';
import AboutUs from './components/AboutUs';
import "./css/styles.css"


function App() {
  return (
    <Router>
      <Routes>
        <Route exact path='/home' element={<Home />} />
        <Route exact path='/simulation' element={<Simulation />} />
        <Route exact path='/dashboard' element={<FuzzyDashboard />} />
        <Route exact path='/report-dashboard' element={<ReportDashboard />} />
        <Route exact path='/' element={<LandingPage />} />
        <Route exact path='/about-us' element={<AboutUs />} />
      </Routes>
    </Router>
  );
}

export default App;