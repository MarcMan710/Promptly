import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import WritingPage from './pages/WritingPage';
import CalendarPage from './pages/CalendarPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<WritingPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/stats" element={<div>Stats Page (Coming Soon)</div>} />
          <Route path="/settings" element={<div>Settings Page (Coming Soon)</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
