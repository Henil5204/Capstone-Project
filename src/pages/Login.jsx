import React from "react";
import "./Login.css";

const Login = () => {
  return (
    <div className="login-page">
      {/* Header */}
      <header className="login-header">
        <div className="logo">
          <span className="logo-text">SHIFT-UP</span>
        </div>

        <div className="portal-links">
          <button className="portal-btn active">Manager Portal</button>
          <button className="portal-btn">Employee Portal</button>
          <button className="portal-btn">Owner Portal</button>
        </div>
      </header>

      {/* Form */}
      <div className="login-container">
        <h1>Welcome back!</h1>
        <p>Enter your Credentials to access your account</p>

        <label>Email address</label>
        <input type="email" placeholder="Enter your email" />

        <div className="password-row">
          <label>Password</label>
          <a href="/">forgot password</a>
        </div>
        <input type="password" placeholder="Name" />

        <div className="remember">
          <input type="checkbox" />
          <span>Remember for 30 days</span>
        </div>

        <button className="login-btn">Login</button>

        <div className="socials">
          <button className="social-btn">Sign in with Google</button>
          <button className="social-btn">Sign in with Apple</button>
        </div>

        <p className="signup">
          Don’t have an account? <span>Sign Up</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
