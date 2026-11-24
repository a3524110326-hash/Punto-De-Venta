import React, { useState } from 'react';
import POS from './components/POS';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('pos_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('pos_token') || null);

  const handleLoginSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    setUser(null);
    setToken(null);
  };

  if (!user || !token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <POS user={user} token={token} onLogout={handleLogout} />;
}

export default App;