import React from "react";
import { Typography } from "antd";
import "./Footer.css";

const { Text } = Typography;

const Footer = () => {
  const socialLinks = [
    {
      name: "X (Twitter)",
      href: "https://x.com/SCAI_Agents/",
      icon: (
        <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Telegram",
      href: "https://t.me/SCAI_Official",
      icon: (
        <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785L21.86 4.593c.314-1.252-.472-1.817-1.195-1.876z" />
        </svg>
      ),
    },
    {
      name: "GitHub",
      href: "https://github.com/SCAI-Foundation",
      icon: (
        <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="unified-footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Left side: Logo and tagline */}
          <div className="footer-brand">
            <div className="brand-info" style={{ textalign: "center", verticalAlign: "center", justifyContent: "center", alignItems: "center" }}>
              <span className="brand-name">
                SCAI <span style={{ fontWeight: 200, fontSize: "22px" }}>| Web3 Brain of Academic</span>
              </span>
            </div>
          </div>

          {/* Right side: Social icons */}
          <div className="footer-social">
            {socialLinks.map((link) => (
              <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" className="social-link" title={link.name}>
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
