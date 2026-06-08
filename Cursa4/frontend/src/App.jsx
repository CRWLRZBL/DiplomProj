import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import CatalogCarDetail from './pages/CatalogCarDetail';
import CatalogManage from './pages/CatalogManage';
import Order from './pages/Order';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Admin from './pages/Admin';
import Configurator from './pages/Configurator';
import TestDrive from './pages/TestDrive';
import About from './pages/About';
import Contacts from './pages/Contacts';
import ConsultationHost from './components/common/ConsultationHost';
import 'bootstrap/dist/css/bootstrap.min.css';
import './DealershipTheme.css';
import './App.css';
import './components/common/ConsultationModal.css';

function App() {
   return (
    <AuthProvider>
      <Router>
        <div className="App dealership-ui d-flex flex-column min-vh-100">
          <Header />
          <main className="main-content flex-grow-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/catalog/manage" element={<CatalogManage />} />
              <Route path="/catalog/:carId" element={<CatalogCarDetail />} />
              <Route path="/configurator" element={<Configurator />} />
              <Route path="/order" element={<Order />} />
              <Route path="/test-drive" element={<TestDrive />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/register" element={<Navigate to="/profile" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <ConsultationHost />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App
