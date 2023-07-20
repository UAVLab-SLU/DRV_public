import { Provider } from 'react-redux';
import Home from './pages/Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Wizard from './pages/Wizard';
import Dashboard from './components/Dashboard';
import FuzzyDashboard from './components/FuzzyDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route exact path='/' element={<Home />} />
        <Route exact path='/simulation' element={<Wizard/>} />
        <Route exact path='/dashboard' element={<FuzzyDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;