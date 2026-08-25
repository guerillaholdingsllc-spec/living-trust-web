import React, { useState, useMemo, useEffect } from "react";

// Stub API functions (replace with real api.js later)
const getCurrentAccount = async () => ({ user: null });
const loginAccount = async () => ({ user: null });
const registerAccount = async () => ({ user: null });
const requestPasswordReset = async () => ({ message: "Email sent" });

// Complete Trust Clauses Data
const TRUST_CLAUSES = [
  {
    id: "spendthrift",
    name: "Spendthrift Clause",
    status: "requested",
    category: "Asset Protection",
    risk: "HIGH",
    description: "Protects beneficiary interests from creditors, lawsuits, transfers, and poor financial decisions before distribution.",
    questionnaire: [
      "Do any beneficiaries have known creditor issues or pending lawsuits?",
      "Are there beneficiaries with spending or addiction concerns?",
      "Should distributions be limited to health, education, maintenance, and support?"
    ]
  },
  {
    id: "discretionary",
    name: "Discretionary Distribution Clause",
    status: "requested",
    category: "Distribution Control",
    risk: "HIGH",
    description: "Gives the trustee controlled discretion over timing, amount, and purpose of distributions.",
    questionnaire: [
      "Should the trustee have sole discretion?",
      "Should distributions be equal or needs-based?",
      "Should distributions be staggered by age?"
    ]
  },
  {
    id: "nocontest",
    name: "No-Contest Clause",
    status: "requested",
    category: "Trust Integrity",
    risk: "MEDIUM",
    description: "Discourages beneficiaries from bringing unsupported challenges to the trust.",
    questionnaire: [
      "Are there family members likely to contest?",
      "Should a probable-cause exception apply?",
      "What should a challenger forfeit?"
    ]
  },
  {
    id: "bloodline",
    name: "Bloodline Protection Clause",
    status: "requested",
    category: "Family Legacy",
    risk: "MEDIUM",
    description: "Keeps inherited assets within the intended family line and defines treatment of spouses, stepchildren, and descendants.",
    questionnaire: [
      "Should adopted or stepchildren be included?",
      "Should divorced spouses be excluded?",
      "Should shares pass per stirpes or per capita?"
    ]
  },
  {
    id: "incapacity",
    name: "Incapacity Clause",
    status: "gap",
    category: "Grantor Protection",
    risk: "CRITICAL",
    description: "Defines how incapacity is determined and when successor trustee authority begins.",
    questionnaire: [
      "Should incapacity require one physician, two physicians, or court order?",
      "Who serves as successor trustee?",
      "Should a trust protector supervise the transition?"
    ]
  },
  {
    id: "trusteeremoval",
    name: "Trustee Removal & Succession",
    status: "gap",
    category: "Trust Governance",
    risk: "HIGH",
    description: "Creates a court-free process for removing, replacing, and sequencing trustees.",
    questionnaire: [
      "Who are the first three successor trustees?",
      "Who can remove a trustee?",
      "Should a corporate trustee be listed as backup?"
    ]
  },
  {
    id: "protector",
    name: "Trust Protector Clause",
    status: "gap",
    category: "Trust Governance",
    risk: "MEDIUM",
    description: "Names a neutral party who can adapt the trust to law changes, trustee problems, or drafting gaps.",
    questionnaire: [
      "Do you want a trust protector?",
      "What powers should the protector have?",
      "Should the protector be an individual or committee?"
    ]
  },
  {
    id: "specialneeds",
    name: "Special Needs Clause",
    status: "gap",
    category: "Beneficiary Care",
    risk: "CRITICAL",
    description: "Protects means-tested benefits for beneficiaries with disabilities through supplemental-needs drafting.",
    questionnaire: [
      "Do any beneficiaries have disabilities?",
      "Do they receive SSI, Medicaid, or other benefits?",
      "Should a sub-trust be created?"
    ]
  },
  {
    id: "pet",
    name: "Pet Trust Clause",
    status: "gap",
    category: "Beneficiary Care",
    risk: "LOW",
    description: "Provides money, instructions, and a caregiver for pets after death or incapacity.",
    questionnaire: [
      "Do you have pets?",
      "Who should care for them?",
      "How much should be set aside?"
    ]
  },
  {
    id: "digitalassets",
    name: "Digital Assets Clause",
    status: "gap",
    category: "Modern Estate Planning",
    risk: "HIGH",
    description: "Adds RUFADAA authority for cryptocurrency, online accounts, digital files, NFTs, domains, and online businesses.",
    questionnaire: [
      "Do you own cryptocurrency or NFTs?",
      "Do you have monetized online accounts?",
      "Where is the digital asset inventory stored?"
    ]
  },
  {
    id: "taxplanning",
    name: "Tax Planning / GST Clause",
    status: "gap",
    category: "Tax Optimization",
    risk: "HIGH",
    description: "Flags estate, gift, GST, and bypass-trust planning issues for attorney review.",
    questionnaire: [
      "Could the estate exceed the federal exemption?",
      "Should assets skip a generation?",
      "Is AB trust planning needed?"
    ]
  },
  {
    id: "amendment",
    name: "Amendment & Revocation",
    status: "gap",
    category: "Trust Flexibility",
    risk: "CRITICAL",
    description: "Defines the grantor's lifetime power to amend or revoke and the formal signing process.",
    questionnaire: [
      "Should the trust be revocable?",
      "Can spouses amend independently?",
      "Should amendments require notarization?"
    ]
  },
  {
    id: "pour-over",
    name: "Pour-Over Will Integration",
    status: "gap",
    category: "Probate Avoidance",
    risk: "CRITICAL",
    description: "Creates a companion will that moves forgotten probate assets into the trust plan.",
    questionnaire: [
      "Should the app generate a pour-over will?",
      "Are any assets likely to remain outside the trust?",
      "Do guardianship provisions need review?"
    ]
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

const ASSET_INTAKE_FIELDS = [
  ["realEstate", "Real estate", "Home, rental, land, timeshare, mineral rights, mortgage details, deed names"],
  ["bankAccounts", "Bank and cash accounts", "Checking, savings, CDs, money market, credit union accounts, cash kept at home"],
  ["investmentAccounts", "Stocks, bonds, and brokerage", "Brokerage accounts, individual stocks, bonds, mutual funds, ETFs, Treasury holdings"],
  ["retirementAccounts", "Retirement accounts", "401(k), IRA, Roth IRA, pension, annuity, beneficiary designations"],
  ["lifeInsurance", "Life insurance", "Carrier, policy type, owner, insured, beneficiaries, approximate death benefit"],
  ["vehicles", "Vehicles and titled property", "Cars, trucks, motorcycles, boats, RVs, trailers, aircraft, titleholder names"],
  ["businessInterests", "Business interests", "LLC, corporation, partnership, sole proprietorship, buy-sell or operating agreement"],
  ["firearms", "Firearms and regulated property", "Firearms, NFA items, permits, storage instructions, transfer restrictions"],
  ["jewelryValuables", "Jewelry, collectibles, and valuables", "Jewelry, art, antiques, watches, coins, precious metals, heirlooms, appraisals"],
  ["digitalAssets", "Digital assets and online accounts", "Crypto, wallets, domains, monetized accounts, cloud files, password manager location"],
  ["debtsLiabilities", "Debts and liabilities", "Mortgages, loans, credit cards, tax debt, guarantees, liens, pending claims"],
  ["safeDepositStorage", "Safe deposit, storage, and documents", "Safe deposit boxes, storage units, original deeds, titles, policies, passwords"]
];

const PRODUCT_TIERS = [
  { id: "base", name: "Base Trust Prep", price: "$397", note: "One-time",
    description: "Guided intake, asset inventory, review-ready document packet, funding checklist, and state execution notes.",
    cta: "Generate base package" },
  { id: "family", name: "Family Trust Prep", price: "$997", note: "One-time",
    description: "Expanded intake for couples, blended families, minor children, multiple asset classes, and trustee instructions.",
    cta: "Generate family package" },
  { id: "maintenance", name: "Annual Maintenance", price: "$149", note: "Per year",
    description: "Annual asset refresh, beneficiary review reminders, trust update prompts, and organized change history.",
    cta: "Start annual maintenance" }
];

// Risk class styling
const getRiskColor = (risk) => {
  switch(risk) {
    case "CRITICAL": return { bg: "#fee2e2", border: "#dc2626", text: "#991b1b" };
    case "HIGH": return { bg: "#fef3c7", border: "#d97706", text: "#92400e" };
    case "MEDIUM": return { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" };
    case "LOW": return { bg: "#d1fae5", border: "#10b981", text: "#065f46" };
    default: return { bg: "#f3f4f6", border: "#9ca3af", text: "#374151" };
  }
};

// Inline components
const UPLBar = () => (
  <div style={{
    backgroundColor: "#1f2937",
    color: "white",
    padding: "12px 20px",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "500"
  }}>
    Living Trust Framework
  </div>
);

const Metric = ({ label, value }) => (
  <div style={{
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    padding: "24px",
    borderRadius: "8px",
    textAlign: "center"
  }}>
    <div style={{ fontSize: "32px", fontWeight: "bold", color: "#1f2937", marginBottom: "8px" }}>
      {value}
    </div>
    <div style={{ fontSize: "14px", color: "#6b7280" }}>
      {label}
    </div>
  </div>
);

// Main Component
export default function LivingTrustFramework() {
  const [activeTab, setActiveTab] = useState("landing");
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ fullName: "", email: "", password: "" });
  const [authStatus, setAuthStatus] = useState({ state: "idle", message: "" });

  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState("incapacity");
  const [selected, setSelected] = useState(TRUST_CLAUSES.map((c) => c.id));

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    state: "CA",
    beneficiaries: "",
    distributionPlan: "",
    successorTrustee: ""
  });

  const [status, setStatus] = useState({ state: "idle", message: "" });

  const filtered = category === "All" ? TRUST_CLAUSES : TRUST_CLAUSES.filter((c) => c.category === category);
  const criticalCount = TRUST_CLAUSES.filter((c) => c.risk === "CRITICAL").length;
  const selectedClauses = useMemo(() => TRUST_CLAUSES.filter((c) => selected.includes(c.id)), [selected]);

  // Auth handlers
  function updateAuthField(e) {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  }

  async function submitAuth(e) {
    e.preventDefault();
    setAuthStatus({ state: "loading", message: authMode === "register" ? "Creating account..." : "Signing in..." });
    try {
      setUser({ email: authForm.email, fullName: authForm.fullName });
      setAuthOpen(false);
      setAuthStatus({ state: "success", message: "Signed in." });
      setForm((current) => ({
        ...current,
        fullName: current.fullName || authForm.fullName || "",
        email: current.email || authForm.email || ""
      }));
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

  function updateField(e) {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  }

  return (
    <main style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <UPLBar />

      {/* Hero Section */}
      <section style={{
        backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "80px 20px",
        textAlign: "center"
      }}>
        <nav style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "60px",
          maxWidth: "1200px",
          margin: "0 auto 60px"
        }}>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            <span style={{
              display: "inline-block",
              width: "40px",
              height: "40px",
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "6px",
              marginRight: "12px",
              lineHeight: "40px"
            }}>LT</span>
            LivingTrust Counsel
          </div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={() => setActiveTab("landing")} style={{ background: "transparent", color: "white", border: "none", cursor: "pointer", fontSize: "16px" }}>Overview</button>
            <button onClick={() => setActiveTab("clauses")} style={{ background: "transparent", color: "white", border: "none", cursor: "pointer", fontSize: "16px" }}>Protections</button>
            <button onClick={() => { if(!user) setAuthOpen(true); else setActiveTab("intake"); }} style={{ background: "transparent", color: "white", border: "none", cursor: "pointer", fontSize: "16px" }}>Intake</button>
            {user ? (
              <button onClick={signOut} style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none", cursor: "pointer", fontSize: "16px", padding: "8px 16px", borderRadius: "4px" }}>Sign Out</button>
            ) : (
              <button onClick={() => setAuthOpen(true)} style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none", cursor: "pointer", fontSize: "16px", padding: "8px 16px", borderRadius: "4px" }}>Sign In</button>
            )}
          </div>
        </nav>

        <h1 style={{ fontSize: "48px", marginBottom: "24px", fontWeight: "bold" }}>
          Protect your family plan before probate decides for you.
        </h1>
        <p style={{ fontSize: "20px", marginBottom: "32px", opacity: 0.9 }}>
          Prepare a state-specific living trust package, organize your successor trustee instructions, and create a clean review file to discuss with a licensed attorney before signing.
        </p>
        <button
          onClick={() => !user ? setAuthOpen(true) : setActiveTab("intake")}
          style={{
            padding: "16px 40px",
            backgroundColor: "white",
            color: "#667eea",
            border: "none",
            borderRadius: "6px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
            marginRight: "16px"
          }}
        >
          Start confidential intake
        </button>
      </section>

      {/* Metrics */}
      <section style={{ padding: "60px 20px", backgroundColor: "#f9fafb", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
          <Metric label="State rule library" value="50" />
          <Metric label="Estate documents" value="4" />
          <Metric label="Review-ready file" value="1 hr" />
          <Metric label="Annual plan reminders" value="1 yr" />
        </div>
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
          justifyContent: "center",
          zIndex: 1000
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
            <button
              type="button"
              onClick={() => setAuthOpen(false)}
              style={{
                float: "right",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#6b7280"
              }}
            >
              ×
            </button>
            <h2 style={{ marginBottom: "8px" }}>{authMode === "register" ? "Create account" : "Sign in"}</h2>
            <p style={{ color: "#6b7280", marginBottom: "24px" }}>Your account saves your intake and connects completed trust packages to your profile.</p>

            {authMode === "register" && (
              <label style={{ display: "block", marginBottom: "20px" }}>
                Full name
                <input
                  name="fullName"
                  value={authForm.fullName}
                  onChange={updateAuthField}
                  style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", border: "1px solid #d1d5db", borderRadius: "4px" }}
                />
              </label>
            )}

            <label style={{ display: "block", marginBottom: "20px" }}>
              Email
              <input
                required
                type="email"
                name="email"
                value={authForm.email}
                onChange={updateAuthField}
                style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "24px" }}>
              Password
              <input
                required
                type="password"
                name="password"
                value={authForm.password}
                onChange={updateAuthField}
                style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </label>

            <button
              type="submit"
              disabled={authStatus.state === "loading"}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginBottom: "10px",
                fontWeight: "bold"
              }}
            >
              {authMode === "register" ? "Create Account" : "Sign In"}
            </button>

            <button
              type="button"
              onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#e5e7eb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              {authMode === "register" ? "I already have an account" : "Create an account"}
            </button>

            {authStatus.message && (
              <p style={{ marginTop: "10px", color: authStatus.state === "error" ? "#dc2626" : "#10b981" }}>
                {authStatus.message}
              </p>
            )}
          </form>
        </div>
      )}

      {/* Clauses Section */}
      {activeTab === "clauses" && (
        <section style={{ padding: "60px 20px", maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "32px", marginBottom: "12px" }}>Trust Protections</h2>
          <p style={{ color: "#6b7280", marginBottom: "32px" }}>
            {criticalCount} CRITICAL protections need review
          </p>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ marginRight: "12px", fontWeight: "500" }}>Filter by Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "16px"
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
            {filtered.map((clause) => {
              const riskColor = getRiskColor(clause.risk);
              return (
                <div
                  key={clause.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "24px",
                    borderRadius: "8px",
                    backgroundColor: selected.includes(clause.id) ? "#eff6ff" : "white",
                    borderLeft: `4px solid ${riskColor.border}`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>{clause.name}</h3>
                    <span style={{
                      backgroundColor: riskColor.bg,
                      color: riskColor.text,
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      {clause.risk}
                    </span>
                  </div>
                  <p style={{ color: "#6b7280", margin: "12px 0", fontSize: "14px" }}>
                    <strong>Category:</strong> {clause.category}
                  </p>
                  <p style={{ color: "#374151", margin: "12px 0", lineHeight: "1.6" }}>
                    {clause.description}
                  </p>
                  <button
                    onClick={() => toggleClause(clause.id)}
                    style={{
                      backgroundColor: selected.includes(clause.id) ? "#667eea" : "#e5e7eb",
                      color: selected.includes(clause.id) ? "white" : "#1f2937",
                      padding: "10px 16px",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      marginTop: "16px"
                    }}
                  >
                    {selected.includes(clause.id) ? "✓ Selected" : "Select"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Intake Section */}
      {activeTab === "intake" && (
        <section style={{ padding: "60px 20px", maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "32px", marginBottom: "12px" }}>Confidential Intake</h2>
          <p style={{ color: "#6b7280", marginBottom: "32px" }}>
            Your information is private and secure. We'll use this to prepare your estate planning documents.
          </p>

          <form style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <label style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: "bold", marginBottom: "8px" }}>Full Name</span>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={updateField}
                style={{
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "16px"
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: "bold", marginBottom: "8px" }}>Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                style={{
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "16px"
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: "bold", marginBottom: "8px" }}>State</span>
              <select
                name="state"
                value={form.state}
                onChange={updateField}
                style={{
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "16px"
                }}
              >
                {STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: "bold", marginBottom: "8px" }}>Successor Trustee</span>
              <input
                type="text"
                name="successorTrustee"
                placeholder="Name and relationship"
                value={form.successorTrustee}
                onChange={updateField}
                style={{
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "16px"
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: "bold", marginBottom: "8px" }}>Beneficiaries</span>
              <textarea
                name="beneficiaries"
                placeholder="Names, relationships, and share amounts"
                value={form.beneficiaries}
                onChange={updateField}
                style={{
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "16px",
                  minHeight: "120px",
                  fontFamily: "inherit"
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: "bold", marginBottom: "8px" }}>Distribution Plan</span>
              <textarea
                name="distributionPlan"
                placeholder="How and when assets should be distributed"
                value={form.distributionPlan}
                onChange={updateField}
                style={{
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "16px",
                  minHeight: "120px",
                  fontFamily: "inherit"
                }}
              />
            </label>

            <button
              type="submit"
              style={{
                padding: "14px 24px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold"
              }}
            >
              Submit Intake
            </button>

            {status.message && (
              <p style={{ color: status.state === "error" ? "#dc2626" : "#10b981", marginTop: "16px" }}>
                {status.message}
              </p>
            )}
          </form>
        </section>
      )}

      {/* Landing Section */}
      {activeTab === "landing" && (
        <section style={{ padding: "60px 20px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "32px", marginBottom: "32px" }}>Professional Estate Planning Workflow</h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
              marginBottom: "48px"
            }}>
              <div style={{ backgroundColor: "#f0f9ff", padding: "24px", borderRadius: "8px", borderLeft: "4px solid #667eea" }}>
                <h3 style={{ margin: "0 0 12px 0", color: "#667eea" }}>Private family instructions</h3>
                <p style={{ margin: 0, color: "#6b7280" }}>Distribution details stay organized for review and final delivery.</p>
              </div>
              <div style={{ backgroundColor: "#f0fdf4", padding: "24px", borderRadius: "8px", borderLeft: "4px solid #10b981" }}>
                <h3 style={{ margin: "0 0 12px 0", color: "#10b981" }}>Probate-avoidance focus</h3>
                <p style={{ margin: 0, color: "#6b7280" }}>Funding guidance makes the trust more than a signed document.</p>
              </div>
              <div style={{ backgroundColor: "#fefce8", padding: "24px", borderRadius: "8px", borderLeft: "4px solid #f59e0b" }}>
                <h3 style={{ margin: "0 0 12px 0", color: "#f59e0b" }}>Attorney review boundary</h3>
                <p style={{ margin: 0, color: "#6b7280" }}>Documents are prepared for review; consult licensed counsel before signing.</p>
              </div>
            </div>

            <h2 style={{ fontSize: "28px", marginBottom: "20px" }}>Estate planning starts with control, privacy, and continuity</h2>
            <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#374151", marginBottom: "20px" }}>
              A revocable living trust is a legal arrangement where a grantor places assets under trust management during life and names who receives or controls those assets after death or incapacity. It is commonly used to avoid probate delays, keep private family instructions out of public court filings, organize successor trustee authority, and give financial institutions a clear path for administration.
            </p>
            <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#374151" }}>
              The trust only works for assets that are properly connected to it. That is why this app generates funding instructions for real estate, bank accounts, brokerage accounts, business interests, vehicles, and digital assets, alongside the trust document itself.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
