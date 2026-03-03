// App.tsx
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Jelovnik from "./components/Jelovnik";
import { LanguageProvider } from "./context/LanguageContext";

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Jelovnik />} />
          <Route path="/:branchSlug" element={<Jelovnik />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
