// src/components/SocialLinks.jsx
import { FaLinkedin, FaFacebook, FaGlobe } from 'react-icons/fa';

export default function SocialLinks({ linkedin, facebook, website }) {
  const links = [
    { url: linkedin, icon: <FaLinkedin />, label: 'LinkedIn' },
    { url: facebook, icon: <FaFacebook />, label: 'Facebook' },
    { url: website,  icon: <FaGlobe />,    label: 'Website'  }
  ].filter(l => l.url);

  if (links.length === 0) return null;

  return (
    <div className="pp‑links">
      {links.map(({ url, icon, label }) => (
        <a
          key={label}
          href={url.startsWith('http') ? url : `https://${url}`}
          target="_blank"
          rel="noopener noreferrer"
          title={label}
        >
          {icon}
          <span className="pp‑link‑text">{url.replace(/^https?:\/\//, '').slice(0, 25)}</span>
        </a>
      ))}
    </div>
  );
}
