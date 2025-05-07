import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/privacyPolicy.css';     // ← new import

export default function PrivacyPolicyPage() {
  return (
    <div className="privacy-policy">
      {/* ---------- HEADER ---------- */}
      <h1>Privacy Policy</h1>
      <p><strong>Effective date:</strong> 7 May 2025<br />
         <em>Last updated: 7 May 2025</em></p>

      {/* ---------- 1. WHO WE ARE ---------- */}
      <h2>1. Who we are</h2>
      <p>
        ScholarTalks (sole-proprietor: <strong>Guillaume&nbsp;Georges</strong>),
        Thadeua Road, Vientiane 01001, Lao PDR (“we”, “us”, “our”) operates the
        ScholarTalks forum (the “Service”). For EU/UK GDPR purposes we are the
        <strong> data controller</strong>.
      </p>
      <p><strong>Contact:</strong> privacy@deepdatasolution.com (preferred) | Postal mail: address above.</p>

      {/* ---------- 2. WHAT DATA WE COLLECT ---------- */}
      <h2>2. What personal data we collect &amp; why</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>When collected</th>
              <th>Stored where</th>
              <th>Purpose</th>
              <th>Legal basis<br />(GDPR Art 6)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Account data – email, Auth0 ID, password hash</td>
              <td>Sign-up</td>
              <td>Auth0 (USA/EU)</td>
              <td>Create &amp; secure your account</td>
              <td>Contract (6-1-b)</td>
            </tr>
            <tr>
              <td>Profile data – display name, avatar URL, bio</td>
              <td>Profile edit</td>
              <td>MySQL (DigitalOcean)</td>
              <td>Show public profile</td>
              <td>Contract</td>
            </tr>
            <tr>
              <td>Public content – posts, comments, votes</td>
              <td>During use</td>
              <td>MySQL</td>
              <td>Forum functionality (public)</td>
              <td>Contract / Legitimate interest</td>
            </tr>
            <tr>
              <td>Cookies / local-storage tokens</td>
              <td>On login</td>
              <td>Browser only</td>
              <td>Keep you signed-in</td>
              <td>Contract</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p><strong>We do <u>not</u> use advertising or analytics cookies and we do <u>not</u> log IP addresses.</strong></p>

      {/* ---------- 3–10 (unchanged content)… ---------- */}
      {/* ... keep the rest of the page exactly as you already have it ... */}

      {/* Link back home */}
      <p style={{ marginTop: '2rem' }}>
        <Link to="/">← Back to home</Link>
      </p>
    </div>
  );
}
