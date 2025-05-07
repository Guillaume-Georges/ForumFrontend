// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';          
import '../styles/footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About */}
        <div>
          <h4>ScholarTalks</h4>
          <p>
            An open-source forum for educators and experts to discuss AI and ed-tech.
          </p>
        </div>

        {/* Community */}
        <div>
          <h5>Community</h5>
          <ul>
            <li>
              <a
                href="https://github.com/orgs/ScholarTalksOrg/repositories"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contribute on GitHub
              </a>
            </li>
            <li>
              <a
                href="https://github.com/orgs/ScholarTalksOrg/discussions"
                target="_blank"
                rel="noopener noreferrer"
              >
                Report an Issue
              </a>
            </li>
            {/* --- NEW --- */}
            <li>
              <Link to="/privacy">Privacy&nbsp;Policy</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        © 2025 ScholarTalks • Built with ❤️ by our community
      </div>
    </footer>
  );
}
