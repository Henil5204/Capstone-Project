import React, { useEffect, useState, useRef } from "react";
  import "../../App.css";
  import "./Home.css";
  import { useLanguage } from "../../context/LanguageContext";
  import LanguageSwitcher from "../../components/LanguageSwitcher";
  import ContactForm from "../../components/ContactForm";

  function useFadeIn() {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
        { threshold: 0.1 }
      );
      obs.observe(el);
      return () => obs.disconnect();
    }, []);
    return [ref, visible];
  }

  const CYCLE_WORDS = ["group chats.", "sticky notes.", "spreadsheets.", "text threads."];

  const features = [
    { title: "Scheduling",        desc: "Build the week's schedule in minutes. Set availability, assign roles, and publish — your team is notified instantly." },
    { title: "Shift Swaps",       desc: "Employees request swaps through the app. Managers approve in one tap. No back-and-forth." },
    { title: "Manager Dashboard", desc: "Who's in, who's out, what's pending — all in one place without digging through messages." },
    { title: "Notifications",     desc: "Shift added, swap approved, schedule changed — the right people find out automatically." },
    { title: "Reports",           desc: "Pull coverage and hours for any period. Built for payroll, not just demos." },
    { title: "Approvals",         desc: "Every swap goes through you. Full context, one decision." },
  ];

  const pricingItems = [
    "Employee scheduling",
    "Shift swap requests",
    "Schedule change notifications",
    "Manager dashboard",
  ];

  const Home = ({ onGetStarted, onLoginClick }) => {
    const { t } = useLanguage();

    const [showHeader, setShowHeader] = useState(true);
    const lastYRef = useRef(0);
    useEffect(() => {
      const handle = () => {
        setShowHeader(window.scrollY < lastYRef.current || window.scrollY < 60);
        lastYRef.current = window.scrollY;
      };
      window.addEventListener("scroll", handle, { passive: true });
      return () => window.removeEventListener("scroll", handle);
    }, []);

    const [wordIdx, setWordIdx] = useState(0);
    const [wordOut, setWordOut] = useState(false);
    useEffect(() => {
      const id = setInterval(() => {
        setWordOut(true);
        setTimeout(() => {
          setWordIdx(i => (i + 1) % CYCLE_WORDS.length);
          setWordOut(false);
        }, 350);
      }, 2400);
      return () => clearInterval(id);
    }, []);

    const [featRef,    featVis]    = useFadeIn();
    const [pricingRef, pricingVis] = useFadeIn();
    const [contactRef, contactVis] = useFadeIn();

    return (
      <div style={{ fontFamily: "var(--font-body)", color: "#1a1a1a", background: "#f7f6f2" }}>

        <header
          className="su-header home-header"
          style={{ opacity: showHeader ? 1 : 0, transition: "opacity 0.3s" }}
        >
          <div className="su-brand">
            <div className="su-logobox">SU</div>
            {t("appName")}
          </div>
          <nav className="su-nav">
            <a href="#features" className="su-navbtn" style={{ textDecoration: "none", color: "#1a1a1a" }}>Features</a>
            <a href="#about"    className="su-navbtn" style={{ textDecoration: "none", color: "#1a1a1a" }}>About</a>
            <a href="#pricing"  className="su-navbtn" style={{ textDecoration: "none", color: "#1a1a1a" }}>Pricing</a>
            <a href="#contact"  className="su-navbtn" style={{ textDecoration: "none", color: "#1a1a1a" }}>Contact</a>
            <LanguageSwitcher />
            <button className="su-btn su-btn-outline su-btn-sm" onClick={onLoginClick}>{t("login")}</button>
            <button className="su-btn su-btn-black su-btn-sm"   onClick={onGetStarted}>{t("getStarted")}</button>
          </nav>
        </header>

        <section className="hero-section hero-section-left">
          <div className="hero-copy hero-copy-animate">
            <p className="hero-eyebrow">Shift scheduling for restaurants</p>
            <h1 className="hero-h1">
              Stop managing<br />shifts in{" "}
              <span className={`hero-word ${wordOut ? "hero-word-out" : "hero-word-in"}`}>
                {CYCLE_WORDS[wordIdx]}
              </span>
            </h1>
            <p className="hero-sub">
              Shift-Up gives managers a real schedule they can publish, and gives employees one place to see it. Swaps go through the app — not through you.
            </p>
            <div className="hero-ctas">
              <button className="cta-primary" onClick={onGetStarted}>Try it free — 7 days</button>
              <button className="cta-secondary" onClick={onLoginClick}>Log in</button>
            </div>
            <p className="hero-fine">No credit card. No sales call. Just the app.</p>
          </div>
        </section>

        <section
          id="features"
          ref={featRef}
          className={`features-section ${featVis ? "section-visible" : "section-hidden"}`}
        >
          <div className="features-header">
            <h2 className="section-title">Everything you need</h2>
            <p className="section-sub">
              Built for businesses where the schedule changes every week and half the team doesn't have work email.
            </p>
          </div>
          <div className="features-grid">
            {features.map(({ title, desc }, i) => (
              <div
                key={title}
                className="feature-cell"
                style={{ transitionDelay: featVis ? `${i * 60}ms` : "0ms" }}
              >
                <div className="feature-dot" />
                <h3 className="feature-title">{title}</h3>
                <p className="feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="pricing"
          ref={pricingRef}
          className={`pricing-section ${pricingVis ? "section-visible" : "section-hidden"}`}
        >
          <h2 className="pricing-heading">SIMPLE PRICING</h2>
          <p className="pricing-subheading">Start free for 7 days. Then just $5 CAD/month.</p>

          <div className="pricing-card">
            <div className="pricing-card-header">
              <div className="pricing-trial-left">
                <span className="pricing-t-badge">T</span>
                <div>
                  <div className="pricing-trial-title">7-Day Free Trial</div>
                  <div className="pricing-trial-sub">No charge until trial ends. Cancel anytime</div>
                </div>
              </div>
              <span className="pricing-free-badge">FREE</span>
            </div>

            <div className="pricing-card-price">
              <span className="pricing-big-dollar">$5</span>
              <div className="pricing-cad-wrap">
                <span className="pricing-cad">CAD</span>
                <span className="pricing-mo">/mo after trial</span>
              </div>
            </div>

            <ul className="pricing-card-list">
              {pricingItems.map((item) => (
                <li key={item} className="pricing-card-item">
                  <span className="pricing-check">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <button className="pricing-card-cta" onClick={onGetStarted}>
              🔒 Start Free Trial — No Credit Card Required
            </button>

            <p className="pricing-card-stripe">🔒 Powered by Stripe · Cancel anytime</p>
          </div>
        </section>

        <section style={{ padding: "56px", background: "#fff" }} id="about">
          <h2 style={{ fontFamily: "var(--font-head)", fontSize: 38, marginBottom: 14 }}>ABOUT SHIFT-UP</h2>
          <p style={{ color: "#555", fontSize: 14, lineHeight: 1.7, maxWidth: 620, marginBottom: 10 }}>
            At ShiftUp, we believe in empowering businesses with smarter, more efficient ways to manage their workforce.
          </p>
          <p style={{ color: "#555", fontSize: 14, lineHeight: 1.7, maxWidth: 620 }}>
            Create and publish schedules in minutes, employees view shifts in real-time, and managers can communicate effectively with their entire team.
          </p>
        </section>

        <div
          ref={contactRef}
          className={contactVis ? "section-visible" : "section-hidden"}
        >
          <ContactForm />
        </div>

        <footer className="home-footer">
          <div className="su-brand" style={{ color: "#fff" }}>
            <div className="su-logobox">SU</div>
            {t("appName")}
          </div>
          <p style={{ color: "#444", fontSize: 12 }}>© {new Date().getFullYear()} Shift-Up</p>
          <div style={{ display: "flex", gap: 24 }}>
            {[["Features","#features"],["About","#about"],["Pricing","#pricing"],["Contact","#contact"]].map(([label, href]) => (
              <a key={label} href={href} style={{ color: "#555", fontSize: 13, textDecoration: "none" }}>{label}</a>
            ))}
            <button
              onClick={onLoginClick}
              style={{ color: "#555", fontSize: 13, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}
            >
              Log in
            </button>
          </div>
        </footer>

      </div>
    );
  };

  export default Home;
  