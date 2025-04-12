import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProcessPage from './pages/ProcessPage';
import BatchPage from './pages/BatchPage';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/process" element={<ProcessPage />} />
        <Route path="/batch" element={<BatchPage />} />
      </Routes>
    </Router>
  );
}

export default App;