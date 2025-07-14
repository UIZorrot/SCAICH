import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./Layout.css";

const Layout = ({ children, showFooter = true }) => {
  return (
    <div className="layout-container light-theme">
      {/* Background */}
      <div className="layout-background" />
      <img src="/bg8.jpg" alt="" className="layout-background-img" />

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
