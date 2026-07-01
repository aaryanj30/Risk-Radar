import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Vendors from "./pages/Vendors";
import Alerts from "./pages/Alerts";
import APIs from "./pages/APIs";
import RiskGraph from "./pages/RiskGraph";
import Copilot from "./pages/Copilot";

function App() {

  return (

      <BrowserRouter>
        <ThemeProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/apis" element={<APIs />} />
              <Route path="/graph" element={<RiskGraph />} />
              <Route path="/analyst" element={<Copilot />} />
            </Routes>
          </Layout>
        </ThemeProvider>
      </BrowserRouter>

  );
}

export default App;