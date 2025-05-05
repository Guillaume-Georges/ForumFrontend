// src/components/Footer.jsx
import React from 'react';
import '../styles/footer.css'; // adjust path if your CSS is elsewhere

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About */}
        <div>
          <h4>ScholarTalks</h4>
          <p>
            An open‑source forum for educators and experts to discuss AI and ed‑tech.
          </p>
        </div>

        {/* Community */}
        <div>
          <h5>Community</h5>
          <ul>
            <li>
              <a
                href="https://github.com/your-org/your-repo"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contribute on GitHub
              </a>
            </li>
            <li>
              <a
                href="https://github.com/your-org/your-repo/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                Report an Issue
              </a>
            </li>
            
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        © 2025 ScholarTalks • Built with ❤️ by our community
      </div>
    </footer>
  );
}
