import React, { useState } from "react";

  export default function ContactForm() {
    const [name,     setName]    = useState("");
    const [email,    setEmail]   = useState("");
    const [message,  setMessage] = useState("");
    const [status,   setStatus]  = useState("idle");
    const [errorMsg, setErrorMsg]= useState("");

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!name.trim() || !email.trim() || !message.trim()) return;
      setStatus("sending");
      setErrorMsg("");
      try {
        const res  = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/contact`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ name, email, message }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("success");
          setName(""); setEmail(""); setMessage("");
          setTimeout(() => setStatus("idle"), 6000);
        } else {
          setErrorMsg(data.error || "Something went wrong. Please try again.");
          setStatus("error");
          setTimeout(() => setStatus("idle"), 6000);
        }
      } catch {
        setErrorMsg("Network error. Please check your connection and try again.");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 6000);
      }
    };

    return (
      <section className="contact-section" id="contact">
        <div className="contact-container">
          <h2 style={{ fontFamily: "var(--font-head)", fontSize: 38, marginBottom: 8, color: "#1a1a1a" }}>
            Contact Us
          </h2>
          <p style={{ color: "#666", fontSize: 15, lineHeight: 1.7 }}>
            Have a question or want to learn more? Send us a message and we'll get back to you.
          </p>
          <form className="contact-form" onSubmit={handleSubmit}>
            <input type="text"  placeholder="Your Name"    value={name}    onChange={e => setName(e.target.value)}    required />
            <input type="email" placeholder="Your Email"   value={email}   onChange={e => setEmail(e.target.value)}   required />
            <textarea           placeholder="Your Message" value={message} onChange={e => setMessage(e.target.value)} required />
            <button type="submit" className="contact-submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send Message"}
            </button>
          </form>
          {status === "success" && (
            <div className="contact-success">✓ Your message has been sent! We'll get back to you soon.</div>
          )}
          {status === "error" && (
            <div className="contact-error">{errorMsg || "Something went wrong. Please try again or email shiftup457@gmail.com."}</div>
          )}
        </div>
      </section>
    );
  }
  