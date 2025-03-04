import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProcessPage from './pages/ProcessPage';
import BatchPage from './pages/BatchPage';
import HistoryPage from './pages/HistoryPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/process" element={<ProcessPage />} />
        <Route path="/batch" element={<BatchPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Router>
  );
}

export default App;