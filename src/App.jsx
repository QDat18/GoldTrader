import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserLayout from './layouts/UserLayout';
import BlankLayout from './layouts/BlankLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

// We will create these layout and page components next
const Placeholder = ({ title }) => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>{title}</h2>
    <p>Component is being converted to React...</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          
          {/* User Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trade" element={<Placeholder title="Trade (Buy/Sell)" />} />
          <Route path="/dca" element={<Placeholder title="DCA Plans" />} />
          <Route path="/history" element={<Placeholder title="Transaction History" />} />
          <Route path="/order" element={<Placeholder title="Order Details" />} />
          <Route path="/notifications" element={<Placeholder title="Notifications" />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<BlankLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<Placeholder title="Admin Dashboard" />} />
        <Route path="/inventory" element={<Placeholder title="Inventory Management" />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
