import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { useBackground } from "../../contexts/BackgroundContext";
import "./Layout.css";

const Layout = ({ children, showFooter = true }) => {
  const { currentTheme } = useBackground();

  return (
    <div className={`layout-container ${currentTheme.name}-theme`}>
      {/* Background */}
      <div className="layout-background" style={{ backgroundColor: currentTheme.background }} />
      <img src="/bg1.png" alt="" className="layout-background-img" />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="layout-main">
        <div className="main-content">{children}</div>
      </main>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
