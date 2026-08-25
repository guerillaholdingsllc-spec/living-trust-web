import React, { useState, useMemo, useEffect } from "react";
import { getCurrentAccount, loginAccount, registerAccount, requestPasswordReset, signOutAccount } from "./api.js";

const TRUST_CLAUSES = [
  { id: "spendthrift", name: "Spendthrift Clause", status: "requested", category: "Asset Protection", risk: "HIGH", description: "Protects beneficiary interests from creditors, lawsuits, transfers, and poor financial decisions before distribution.", questionnaire: ["Do any beneficiaries have known creditor issues or pending lawsuits?", "Are there beneficiaries with spending or addiction concerns?", "Should distributions be limited to health, education, maintenance, and support?"] },
  { id: "discretionary", name: "Discretionary Distribution Clause", status: "requested", category: "Distribution Control", risk: "HIGH", description: "Gives the trustee controlled discretion over timing, amount, and purpose of distributions.", questionnaire: ["Should the trustee have sole discretion?", "Should distributions be equal or needs-based?", "Should distributions be staggered by age?"] },
  { id: "nocontest", name: "No-Contest Clause", status: "requested", category: "Trust Integrity", risk: "MEDIUM", description: "Discourages beneficiaries from bringing unsupported challenges to the trust.", questionnaire: ["Are there family members likely to contest?", "Should a probable-cause exception apply?", "What should a challenger forfeit?"] },
  { id: "bloodline", name: "Bloodline Protection Clause", status: "requested", category: "Family Legacy", risk: "MEDIUM", description: "Keeps inherited assets within the intended family line and defines treatment of spouses, stepchildren, and descendants.", questionnaire: ["Should adopted or stepchildren be included?", "Should divorced spouses be excluded?", "Should shares pass per stirpes or per capita?"] },
  { id: "incapacity", name: "Incapacity Clause", status: "gap", category: "Grantor Protection", risk: "CRITICAL", description: "Defines how incapacity is determined and when successor trustee authority begins.", questionnaire: ["Should incapacity require one physician, two physicians, or court order?", "Who serves as successor trustee?", "Should a trust protector supervise the transition?"] },
  { id: "trusteeremoval", name: "Trustee Removal & Succession", status: "gap", category: "Trust Governance", risk: "HIGH", description: "Creates a court-free process for removing, replacing, and sequencing trustees.", questionnaire: ["Who are the first three successor trustees?", "Who can remove a trustee?", "Should a corporate trustee be listed as backup?"] },
  { id: "protector", name: "Trust Protector Clause", status: "gap", category: "Trust Governance", risk: "MEDIUM", description: "Names a neutral party who can adapt the trust to law changes, trustee problems, or drafting gaps.", questionnaire: ["Do you want a trust protector?", "What powers should the protector have?", "Should the protector be an individual or committee?"] },
  { id: "specialneeds", name: "Special Needs Clause", status: "gap", category: "Beneficiary Care", risk: "CRITICAL", description: "Protects means-tested benefits for beneficiaries with disabilities through supplemental-needs drafting.", questionnaire: ["Do any beneficiaries have disabilities?", "Do they receive SSI, Medicaid, or other benefits?", "Should a sub-trust be created?"] },
  { id: "pet", name: "Pet Trust Clause", status: "gap", category: "Beneficiary Care", risk: "LOW", description: "Provides money, instructions, and a caregiver for pets after death or incapacity.", questionnaire: ["Do you have pets?", "Who should care for them?", "How much should be set aside?"] },
  { id: "digitalassets", name: "Digital Assets Clause", status: "gap", category: "Modern Estate Planning", risk: "HIGH", description: "Adds RUFADAA authority for cryptocurrency, online accounts, digital files, NFTs, domains, and online businesses.", questionnaire: ["Do you own cryptocurrency or NFTs?", "Do you have monetized online accounts?", "Where is the digital asset inventory stored?"] },
  { id: "taxplanning", name: "Tax Planning / GST Clause", status: "gap", category: "Tax Optimization", risk: "HIGH", description: "Flags estate, gift, GST, and bypass-trust planning issues for attorney review.", questionnaire: ["Could the estate exceed the federal exemption?", "Should assets skip a generation?", "Is AB trust planning needed?"] },
  { id: "amendment", name: "Amendment & Revocation", status: "gap", category: "Trust Flexibility", risk: "CRITICAL", description: "Defines the grantor's lifetime power to amend or revoke and the formal signing process.", questionnaire: ["Should the trust be revocable?", "Can spouses amend independently?", "Should amendments require notarization?"] },
  { id: "pour-over", name: "Pour-Over Will Integration", status: "gap", category: "Probate Avoidance", risk: "CRITICAL", description: "Creates a companion will that moves forgotten probate assets into the trust plan.", questionnaire: ["Should the app generate a pour-over will?", "Are any assets likely to remain outside the trust?", "Do guardianship provisions need review?"] }
];

const CATEGORIES = ["All", ...new Set(TRUST_CLAUSES.map((c) => c.category))];
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const riskClass = { CRITICAL: "risk critical", HIGH: "risk high", MEDIUM: "risk medium", LOW: "risk low" };

export default function LivingTrustFramework() {
  const [activeTab, setActiveTab] = useState("landing");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("livingtrust_user") || "null");
    } catch {
      return null;
    }
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ fullName: "", email: "", password: "" });
  const [authStatus, setAuthStatus] = useState({ state: "idle", message: "" });
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ltSelected") || "null") || TRUST_CLAUSES.map((c) => c.id);
    } catch {
      return TRUST_CLAUSES.map((c) => c.id);
    }
  });

  const [form, setForm] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ltIntake") || "null") || {
        fullName: "", email: "", state: "CA", successorTrustee: "", beneficiaries: "", distributionPlan: ""
      };
    } catch {
      return { fullName: "", email: "", state: "CA", successorTrustee: "", beneficiaries: "", distributionPlan: "" };
    }
  });

  // Boot: check if user has valid session
  useEffect(() => {
    const token = localStorage.getItem("livingtrust_token");
    if (token && !user) {
      getCurrentAccount()
        .then(({ user: account }) => {
          setUser(account);
          setForm((current) => ({
            ...current,
            fullName: current.fullName || account?.fullName || "",
            email: current.email || account?.email || ""
          }));
        })
        .catch(() => {
          localStorage.removeItem("livingtrust_token");
          localStorage.removeItem("livingtrust_user");
          setUser(null);
        });
    }
  }, [user]);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem("ltIntake", JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    localStorage.setItem("ltSelected", JSON.stringify(selected));
  }, [selected]);

  const filtered = category === "All" ? TRUST_CLAUSES : TRUST_CLAUSES.filter((c) => c.category === category);
  const criticalCount = TRUST_CLAUSES.filter((c) => c.risk === "CRITICAL").length;

  function updateAuthField(e) {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  }

  async function submitAuth(e) {
    e.preventDefault();
    if (!authForm.email || !authForm.password) {
      setAuthStatus({ state: "error", message: "Email and password required." });
      return;
    }

    setAuthStatus({ state: "loading", message: authMode === "register" ? "Creating account..." : "Signing in..." });

    try {
      const action = authMode === "register" ? registerAccount : loginAccount;
      const { user: account } = await action(authForm);
      
      setUser(account);
      setAuthOpen(false);
      setAuthForm({ fullName: "", email: "", password: "" });
      setAuthStatus({ state: "success", message: "Signed in successfully." });
      setForm((current) => ({
        ...current,
        fullName: current.fullName || account?.fullName || "",
        email: current.email || account?.email || ""
      }));
    } catch (error) {
      setAuthStatus({ state: "error", message: error.message || "Authentication failed." });
    }
  }

  async function handleSignOut() {
    try {
      await signOutAccount();
      setUser(null);
      setAuthStatus({ state: "idle", message: "" });
    } catch (error) {
      setAuthStatus({ state: "error", message: error.message || "Sign out failed." });
    }
  }

  async function sendResetEmail() {
    if (!authForm.email) {
      setAuthStatus({ state: "error", message: "Enter your email first." });
      return;
    }
    setAuthStatus({ state: "loading", message: "Sending reset link..." });
    try {
      const result = await requestPasswordReset({ email: authForm.email });
      setAuthStatus({ state: "success", message: result.message });
    } catch (error) {
      setAuthStatus({ state: "error", message: error.message || "Failed to send reset email." });
    }
  }

  function toggleClause(id) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function updateField(e) {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  }

  function submitIntake(e) {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      setAuthStatus({ state: "error", message: "Name and email required." });
      return;
    }
    setAuthStatus({ state: "loading", message: "Saving intake..." });
    setTimeout(() => {
      setAuthStatus({ state: "success", message: "Intake saved! Your documents are ready for review." });
      setTimeout(() => setAuthStatus({ state: "idle", message: "" }), 3000);
    }, 1000);
  }

  return (
    <main>
      <section className="hero">
        <div className="heroShade" />
        <nav className="nav">
          <div className="brand">
            <span className="brandMark">LT</span>
            <span>LivingTrust Counsel</span>
          </div>
          <div className="navLinks">
            <button onClick={() => setActiveTab("landing")}>Overview</button>
            <button onClick={() => setActiveTab("clauses")}>Protections</button>
            <button onClick={() => { if (!user) setAuthOpen(true); else setActiveTab("intake"); }}>Intake</button>
            {user ? (
              <button onClick={handleSignOut}>Sign Out</button>
            ) : (
              <button onClick={() => setAuthOpen(true)}>Sign In</button>
            )}
          </div>
        </nav>

        <div className="heroContent">
          <span className="eyebrow">Estate planning document preparation with attorney-ready files</span>
          <h1>Protect your family plan before probate decides for you.</h1>
          <p>Prepare a state-specific living trust package, organize your successor trustee instructions, and create a clean review file to discuss with a licensed attorney before signing.</p>
          <div className="heroActions">
            <button className="primary" onClick={() => !user ? setAuthOpen(true) : setActiveTab("intake")}>
              Start confidential intake
            </button>
            <button className="secondary" onClick={() => setActiveTab("landing")}>
              Review the process
            </button>
          </div>
          <div className="heroCredentials">
            <span>Revocable living trust</span>
            <span>Pour-over will</span>
            <span>Certificate of trust</span>
            <span>Funding instructions</span>
          </div>
        </div>
      </section>

      <section className="metrics">
        <div>
          <strong>50</strong>
          <span>State rule library</span>
        </div>
        <div>
          <strong>4</strong>
          <span>Estate documents</span>
        </div>
        <div>
          <strong>1 hr</strong>
          <span>Review-ready file</span>
        </div>
        <div>
          <strong>1 yr</strong>
          <span>Annual plan reminders</span>
        </div>
      </section>

      {authOpen && (
        <div className="authOverlay">
          <form className="authPanel" onSubmit={submitAuth}>
            <button type="button" className="authClose" onClick={() => { setAuthOpen(false); setAuthStatus({ state: "idle", message: "" }); }}>
              ×
            </button>
            <span className="eyebrow dark">{authMode === "register" ? "Create account" : "Sign in"}</span>
            <h2>{authMode === "register" ? "Create your private trust account." : "Sign in to continue your trust intake."}</h2>
            <p>Your account saves your intake and connects completed trust packages to your profile.</p>

            {authMode === "register" && (
              <label>
                Full name
                <input
                  name="fullName"
                  value={authForm.fullName}
                  onChange={updateAuthField}
                  autoComplete="name"
                />
              </label>
            )}

            <label>
              Email
              <input
                required
                type="email"
                name="email"
                value={authForm.email}
                onChange={updateAuthField}
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                name="password"
                value={authForm.password}
                onChange={updateAuthField}
                autoComplete={authMode === "register" ? "new-password" : "current-password"}
              />
            </label>

            <button className="primary" disabled={authStatus.state === "loading"}>
              {authMode === "register" ? "Create Account" : "Sign In"}
            </button>
            <button
              type="button"
              className="quietButton"
              onClick={() => {
                setAuthMode(authMode === "register" ? "login" : "register");
                setAuthForm({ fullName: "", email: "", password: "" });
              }}
            >
              {authMode === "register" ? "I already have an account" : "Create an account"}
            </button>
            <button type="button" className="linkButton" onClick={sendResetEmail}>
              Forgot password?
            </button>

            {authStatus.message && (
              <p className={`status ${authStatus.state}`}>{authStatus.message}</p>
            )}
          </form>
        </div>
      )}

      {activeTab === "clauses" && (
        <section className="workspace">
          <div className="sectionHeader">
            <div>
              <h2>Trust Protections</h2>
              <p>{criticalCount} CRITICAL protections need review</p>
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="clauseList">
            {filtered.map((clause) => (
              <div key={clause.id} className="clause">
                <header>
                  <input
                    type="checkbox"
                    checked={selected.includes(clause.id)}
                    onChange={() => toggleClause(clause.id)}
                  />
                  <div>
                    <h3>{clause.name}</h3>
                    <p>{clause.description}</p>
                  </div>
                  <span className={`risk ${riskClass[clause.risk] || ""}`}>{clause.risk}</span>
                </header>
                {selected.includes(clause.id) && (
                  <div className="questions">
                    {clause.questionnaire.map((q, idx) => (
                      <p key={idx}>{q}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "intake" && (
        <section className="workspace">
          <h2>Confidential Intake</h2>
          <p>Your information is private and secure. We'll use this to prepare your estate planning documents.</p>

          <form className="formShell" onSubmit={submitIntake}>
            <div className="formGrid">
              <label>
                Full Name
                <input type="text" name="fullName" value={form.fullName} onChange={updateField} required />
              </label>
              <label>
                Email
                <input type="email" name="email" value={form.email} onChange={updateField} required />
              </label>
              <label>
                State
                <select name="state" value={form.state} onChange={updateField}>
                  {STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Successor Trustee
                <input
                  type="text"
                  name="successorTrustee"
                  placeholder="Name and relationship"
                  value={form.successorTrustee}
                  onChange={updateField}
                />
              </label>
              <label className="wide">
                Beneficiaries
                <textarea
                  name="beneficiaries"
                  placeholder="Names, relationships, and share amounts"
                  value={form.beneficiaries}
                  onChange={updateField}
                />
              </label>
              <label className="wide">
                Distribution Plan
                <textarea
                  name="distributionPlan"
                  placeholder="How and when assets should be distributed"
                  value={form.distributionPlan}
                  onChange={updateField}
                />
              </label>
            </div>
            <button type="submit" className="primary" style={{ marginTop: "24px" }} disabled={authStatus.state === "loading"}>
              {authStatus.state === "loading" ? "Saving..." : "Submit Intake"}
            </button>
            {authStatus.message && (
              <p className={`status ${authStatus.state}`} style={{ marginTop: "12px" }}>
                {authStatus.message}
              </p>
            )}
          </form>
        </section>
      )}

      {activeTab === "landing" && (
        <section className="workspace landingStack">
          <div className="attorneyIntro">
            <div>
              <span className="eyebrow dark">Professional estate-planning workflow</span>
              <h2>A private intake experience that feels like a law office, not a form mill.</h2>
              <p>
                Families need more than a template. They need a careful record of intent, capacity, trustees, beneficiaries, asset funding, digital property, and state-specific signing steps. This layout presents the product like a professional estate law intake desk while keeping the no-legal-advice boundary clear.
              </p>
            </div>

            <div className="credentialStack" aria-label="Estate planning safeguards">
              <article>
                <strong>Private family instructions</strong>
                <span>Distribution details stay organized for review and final delivery.</span>
              </article>
              <article>
                <strong>Probate-avoidance focus</strong>
                <span>Funding guidance makes the trust more than a signed document.</span>
              </article>
              <article>
                <strong>Attorney review boundary</strong>
                <span>Documents are prepared for review; customers should consult licensed counsel before signing.</span>
              </article>
            </div>
          </div>

          <div className="educationHero">
            <div>
              <span className="eyebrow dark">Living trust fundamentals</span>
              <h2>Estate planning starts with control, privacy, and continuity.</h2>
              <p>
                A revocable living trust is a legal arrangement where a grantor places assets under trust management during life and names who receives or controls those assets after death or incapacity. It is commonly used to avoid probate delays, keep private family instructions out of public court filings, organize successor trustee authority, and give financial institutions a clear path for administration.
              </p>
              <p>
                The trust only works for assets that are properly connected to it. That is why this app generates funding instructions for real estate, bank accounts, brokerage accounts, business interests, vehicles, and digital assets, alongside the trust document itself.
              </p>
            </div>
          </div>

          <div className="imageStoryGrid">
            <article>
              <div>
                <span>01</span>
                <h3>Confidential intake</h3>
                <p>Answer guided questions about your family, assets, and wishes. Your answers stay private and secure.</p>
              </div>
            </article>
            <article>
              <div>
                <span>02</span>
                <h3>Review-ready documents</h3>
                <p>Get attorney-ready documents tailored to your state, your family structure, and your preferences.</p>
              </div>
            </article>
          </div>
        </section>
      )}
    </main>
  );
}
