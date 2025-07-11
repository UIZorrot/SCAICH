import React, { useState, useEffect } from 'react';
import { Button, Drawer, Typography } from 'antd';
import { MenuOutlined, CloseOutlined, UserOutlined, BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBackground } from '../../contexts/BackgroundContext';
import './Header.css';

const { Title, Text } = Typography;

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme, switchTheme } = useBackground();

  // Navigation items
  const navigation = [
    { name: 'Search', href: '/app/search', key: 'search' },
    { name: 'Box', href: '/app/box', key: 'box' },
    { name: 'Press (On Going)', href: '/app/press', key: 'press' },
    { name: 'Community', href: 'https://discord.gg/JrkYAQTpz7', external: true },
  ];

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update active section based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/app/search')) {
      setActiveSection('search');
    } else if (path.includes('/app/box')) {
      setActiveSection('box');
    } else if (path.includes('/app/press')) {
      setActiveSection('press');
    } else {
      setActiveSection('');
    }
  }, [location.pathname]);

  // Handle navigation click
  const handleNavClick = (item) => {
    setMobileMenuOpen(false);

    if (item.external) {
      window.open(item.href, '_blank', 'noopener noreferrer');
    } else {
      navigate(item.href);
    }
  };

  return (
    <header className="unified-header">
      <nav className="header-nav">
        <div className="header-content">
          {/* Logo */}
          <div className="header-logo">
            <div
              className="logo-container"
              onClick={() => navigate('/app/search')}
              style={{ cursor: 'pointer' }}
            >
              <img
                src="/rocket-icon.png"
                alt="SCAI Logo"
                className="logo-image"
              />
              <span className="logo-text">SCAI</span>
            </div>
          </div>

          {/* Desktop Navigation - Centered */}
          {!isMobile && (
            <div className="desktop-nav-center">
              <div className="nav-links">
                {navigation.map((item) => (
                  <button
                    key={item.key || item.name}
                    onClick={() => handleNavClick(item)}
                    className={`nav-link ${activeSection === item.key ? 'active' : ''}`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Right side - Theme Toggle and Login Button */}
          {!isMobile && (
            <div className="header-right">
              <Button
                type="text"
                icon={currentTheme.isDark ? <BulbOutlined /> : <BulbFilled />}
                className="theme-toggle-btn"
                onClick={switchTheme}
                title={`Switch to ${currentTheme.isDark ? 'Light' : 'Dark'} Theme`}
              />
              <span> </span>
              <Button
                type="text"
                icon={<UserOutlined />}
                className="login-btn"
                onClick={() => navigate('/app/search')} // 暂时跳转到搜索页面
              >
                Login
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-button"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <CloseOutlined className="menu-icon" />
              ) : (
                <MenuOutlined className="menu-icon" />
              )}
            </button>
          )}
        </div>

        {/* Mobile menu */}
        <Drawer
          title="Navigation"
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          className="mobile-drawer"
        >
          <div className="mobile-nav-links">
            {navigation.map((item) => (
              <Button
                key={item.key || item.name}
                type="text"
                block
                onClick={() => handleNavClick(item)}
                className={`mobile-nav-link ${activeSection === item.key ? 'active' : ''}`}
              >
                {item.name}
              </Button>
            ))}
          </div>
        </Drawer>
      </nav>
    </header>
  );
};

export default Header;
