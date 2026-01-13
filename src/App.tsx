// App.tsx
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Jelovnik from "./components/Jelovnik";
import AdminLogin from "./components/AdminLogin";
import { LanguageProvider } from "./context/LanguageContext";
import AdminApp from "./components/admin/AdminApp";

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          {/* GOSTI */}
          <Route path="/" element={<Jelovnik />} />
          <Route path="/:branchSlug" element={<Jelovnik />} />

          {/* ADMIN */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
