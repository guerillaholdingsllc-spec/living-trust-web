import React, { useState, useMemo, useEffect } from "react";

// Stub API functions (replace with real api.js later)
const getCurrentAccount = async () => ({ user: null });
const loginAccount = async () => ({ user: null });
const registerAccount = async () => ({ user: null });
const requestPasswordReset = async () => ({ message: "Email sent" });

// Static data
const TRUST_CLAUSES = [
  {
    id: "spendthrift",
    name: "Spendthrift Clause",
    status: "requested",
    category: "Asset Protection",
    risk: "HIGH",
    description: "Protects beneficiary interests from creditors and lawsuits.",
    questionnaire: ["Question 1?", "Question 2?", "Question 3?"]
  },
  {
    id: "incapacity",
    name: "Incapacity Clause",
    status: "gap",
    category: "Grantor Protection",
    risk: "CRITICAL",
    description: "Defines how incapacity is determined.",
    questionnaire: ["Question 1?", "Question 2?"]
  }
];

const CATEGORIES = ["All", ...new Set(TRUST_CLAUSES.map((c) => c.category))];

const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const PRODUCT_TIERS = [
  {
    id: "base",
    name: "Base Trust Prep",
    price: "$397",
    note: "One-time",
    description: "Guided intake and document packet.",
    cta: "Generate base package"
  }
];

// Stub components
const UPLBar = () => <div className="uplBar">Living Trust Framework</div>;
const Metric = ({ label, value }) => (
  <div className="metric">
    <div className="metricLabel">{label}</div>
    <div className="metricValue">{value}</div>
  </div>
);

// Main component
export default function LivingTrustFramework() {
  const [activeTab, setActiveTab] = useState("landing");
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authForm, setAuthForm] = useState({ fullName: "", email: "", password: "" });
  const [authStatus, setAuthStatus] = useState({ state: "idle", message: "" });

  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(TRUST_CLAUSES.map((c) => c.id));

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    state: "CA",
    beneficiaries: "",
    distributionPlan: ""
  });

  const filtered = category === "All" 
    ? TRUST_CLAUSES 
    : TRUST_CLAUSES.filter((c) => c.category === category);

  const selectedClauses = useMemo(
    () => TRUST_CLAUSES.filter((c) => selected.includes(c.id)),
    [selected]
  );

  // Auth handlers
  function updateAuthField(e) {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  }

  async function submitAuth(e) {
    e.preventDefault();
    setAuthStatus({ state: "loading", message: "Processing..." });
    try {
      // Stub - replace with real auth later
      setUser({ email: authForm.email, fullName: authForm.fullName });
      setAuthOpen(false);
      setAuthStatus({ state: "success", message: "Signed in." });
    } catch (error) {
      setAuthStatus({ state: "error", message: error.message });
    }
  }

  function signOut() {
    setUser(null);
  }

  function toggleClause(id) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  return (
    <main>
      <UPLBar />

      {/* Hero Section */}
      <section className="hero" style={{ backgroundColor: "#f5f5f5", padding: "60px 20px" }}>
        <nav className="nav" style={{ marginBottom: "40px" }}>
          <div className="brand" style={{ fontWeight: "bold", fontSize: "18px" }}>
            LT - LivingTrust Counsel
          </div>
          <div className="navLinks" style={{ display: "flex", gap: "20px" }}>
            <button onClick={() => setActiveTab("landing")}>Overview</button>
            <button onClick={() => setActiveTab("clauses")}>Protections</button>
            <button onClick={() => setActiveTab("intake")}>Intake</button>
            {user ? (
              <button onClick={signOut}>Sign Out ({user.email})</button>
            ) : (
              <button onClick={() => setAuthOpen(true)}>Sign In</button>
            )}
          </div>
        </nav>

        <div className="heroContent" style={{ maxWidth: "800px" }}>
          <h1>Protect your family plan before probate decides for you.</h1>
          <p>Prepare a state-specific living trust package with attorney-ready documents.</p>
          <button 
            style={{ 
              padding: "12px 24px", 
              backgroundColor: "#007bff", 
              color: "white", 
              border: "none", 
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px"
            }}
            onClick={() => !user ? setAuthOpen(true) : setActiveTab("intake")}
          >
            Start Intake
          </button>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="metrics" style={{ padding: "40px 20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
        <Metric label="State rule library" value="50" />
        <Metric label="Estate documents" value="4" />
        <Metric label="Review-ready file" value="1 hr" />
        <Metric label="Annual reminders" value="1 yr" />
      </section>

      {/* Auth Modal */}
      {authOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <form 
            onSubmit={submitAuth}
            style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "8px",
              maxWidth: "400px",
              width: "90%"
            }}
          >
            <h2>Sign In</h2>
            <label style={{ display: "block", marginBottom: "20px" }}>
              Email
              <input 
                required 
                type="email" 
                name="email" 
                value={authForm.email}
                onChange={updateAuthField}
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              />
            </label>
            <label style={{ display: "block", marginBottom: "20px" }}>
              Password
              <input 
                required 
                type="password" 
                name="password" 
                value={authForm.password}
                onChange={updateAuthField}
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              />
            </label>
            <button 
              type="submit"
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginBottom: "10px"
              }}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => setAuthOpen(false)}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#e9ecef",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            {authStatus.message && <p style={{ marginTop: "10px", color: authStatus.state === "error" ? "red" : "green" }}>{authStatus.message}</p>}
          </form>
        </div>
      )}

      {/* Clauses Section */}
      {activeTab === "clauses" && (
        <section style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
          <h2>Trust Protections</h2>
          
          <div style={{ marginBottom: "20px" }}>
            <label>Filter by Category: </label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {filtered.map((clause) => (
              <div 
                key={clause.id}
                style={{
                  border: "1px solid #ddd",
                  padding: "20px",
                  borderRadius: "8px",
                  backgroundColor: selected.includes(clause.id) ? "#e7f3ff" : "white"
                }}
              >
                <h3>{clause.name}</h3>
                <p><strong>Category:</strong> {clause.category}</p>
                <p><strong>Risk:</strong> {clause.risk}</p>
                <p>{clause.description}</p>
                <button
                  onClick={() => toggleClause(clause.id)}
                  style={{
                    backgroundColor: selected.includes(clause.id) ? "#007bff" : "#e9ecef",
                    color: selected.includes(clause.id) ? "white" : "black",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  {selected.includes(clause.id) ? "✓ Selected" : "Select"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Intake Section */}
      {activeTab === "intake" && (
        <section style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
          <h2>Confidential Intake</h2>
          <form style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <label>
              Full Name:
              <input type="text" style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }} />
            </label>
            <label>
              Email:
              <input type="email" style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }} />
            </label>
            <label>
              State:
              <select style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}>
                {STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </label>
            <label>
              Beneficiaries:
              <textarea style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", minHeight: "100px" }} />
            </label>
            <button
              type="submit"
              style={{
                padding: "12px 24px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              Submit Intake
            </button>
          </form>
        </section>
      )}

      {/* Default Landing */}
      {activeTab === "landing" && (
        <section style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
          <h2>How It Works</h2>
          <p>1. Create an account and sign in</p>
          <p>2. Review trust protection clauses</p>
          <p>3. Complete confidential intake</p>
          <p>4. Download attorney-ready documents</p>
        </section>
      )}
    </main>
  );
}