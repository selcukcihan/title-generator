import { useState, useEffect } from "react";
import "./App.css";

interface User {
  githubId: number;
  name?: string;
  email?: string;
  avatarUrl: string;
  titles: string[];
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/user", {
        credentials: "include", // Ensure cookies are sent
      });
      if (response.status === 401) {
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.startsWith("/auth/login")) {
          window.location.href = "/auth/login";
        }
        return;
      }
      if (response.ok) {
        const userData = (await response.json()) as User;
        setUser(userData);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.startsWith("/auth/login")) {
        window.location.href = "/auth/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/auth/logout");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container">
      <button onClick={handleLogout} className="logout-btn">
        [logout]
      </button>
      <div className="header">
        <h1>&gt; title-generator</h1>
      </div>

      <div className="user-card">
        <div className="user-avatar">
          <img src={user.avatarUrl} alt="Avatar" />
        </div>
        <div className="user-info">
          {user.name && (
            <div className="info-line">
              <span className="label">name:</span>
              <span className="value">{user.name}</span>
            </div>
          )}
          {user.email && (
            <div className="info-line">
              <span className="label">email:</span>
              <span className="value">{user.email}</span>
            </div>
          )}
          <div className="info-line">
            <span className="label">titles:</span>
            <span className="value">[{user.titles.length}]</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
