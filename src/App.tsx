// App.tsx
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Jelovnik from "./components/Jelovnik";
import AdminPanel from "./components/AdminPanel";
import AdminLogin from "./components/AdminLogin";
import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Jelovnik />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;