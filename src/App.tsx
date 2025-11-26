import { useState, useEffect } from "react";
import type { UserWithTitles } from "../types";

function App() {
  const [user, setUser] = useState<UserWithTitles | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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
        const userData = (await response.json()) as UserWithTitles;
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

  const handleGenerateTitle = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/user", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        const userData = (await response.json()) as UserWithTitles;
        setUser(userData);
      } else {
        console.error("Failed to generate title:", response.statusText);
      }
    } catch (error) {
      console.error("Error generating title:", error);
    } finally {
      setGenerating(false);
    }
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
  const USER_DATA = user;
  return (
    <div className="layout">
      <header className="header">
        <button
          className="logout-btn"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          [ logout ]
        </button>
      </header>

      <main className="profile-card">
        <div className="profile-header">
          <img
            src={USER_DATA.avatarUrl}
            alt={`${USER_DATA.login}'s avatar`}
            className="avatar"
            data-testid="img-avatar"
          />
          <div className="user-info">
            {USER_DATA.name && (
              <h1 data-testid="text-name">{USER_DATA.name}</h1>
            )}

            <p className="login-handle" data-testid="text-login">
              @{USER_DATA.login}
              {!USER_DATA.name && <span className="terminal-cursor"></span>}
              {USER_DATA.name && <span className="terminal-cursor"></span>}
            </p>

            {USER_DATA.email && (
              <p className="email" data-testid="text-email">
                &lt;{USER_DATA.email}&gt;
              </p>
            )}
          </div>
        </div>

        <section className="titles-section">
          <div className="titles-section-header">
            <h2>// Titles_</h2>
            <button
              onClick={handleGenerateTitle}
              disabled={generating}
              className="generate-title-btn"
              data-testid="button-generate-title"
            >
              {generating ? "Generating..." : "Generate my title"}
            </button>
          </div>
          <ul className="titles-list">
            {USER_DATA.titles.map((title) => (
              <li
                key={title.id}
                className="title-item"
                data-testid={`row-title-${title.id}`}
              >
                <span className="title-text">"{title.text}"</span>
                <a
                  href={`?title_id=${title.id}`}
                  className="share-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`link-share-${title.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      `Shared URL: ${window.location.origin}?title_id=${title.id}`
                    );
                  }}
                >
                  share_ptr &rarr;
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default App;
