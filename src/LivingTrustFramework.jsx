import React, { useState, useEffect } from "react";
import { getCurrentAccount, loginAccount, registerAccount, requestPasswordReset, signOutAccount } from "./api.js";
import { saveIntakeForm, saveTrustClauses } from "./api/trustData.js";
import "./styles.css";

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
      "Should distributions be limited to health, education, maintenance and support?"
    ]
  },
  {
    id: "discretionary",
    name: "Discretionary Distribution Clause",
    status: "requested",
    category: "Distribution Control",
    risk: "HIGH",
    description: "Gives the trustee controlled discretion over distribution timing, amounts, and purpose of distributions.",
    questionnaire: [
      "Should the trustee have sole discretion?",
      "Should there be guidelines for trustee decisions?",
      "What should trigger or limit trustee discretion?"
    ]
  },
  {
    id: "dynasty",
    name: "Dynasty Trust Clause",
    status: "optional",
    category: "Tax Planning",
    risk: "MEDIUM",
    description: "Extends trust benefits across multiple generations while minimizing estate and generation-skipping taxes.",
    questionnaire: [
      "Do you want to provide for grandchildren?",
      "Is multi-generational wealth transfer a goal?",
      "Should there be generation-skipping tax planning?"
    ]
  },
  {
    id: "charitable",
    name: "Charitable Distribution Clause",
    status: "optional",
    category: "Philanthropy",
    risk: "LOW",
    description: "Directs distributions to qualified charities, providing tax benefits and philanthropic legacy.",
    questionnaire: [
      "Which charities should benefit?",
      "Should charitable distributions be mandatory or discretionary?",
      "What percentage of assets should go to charity?"
    ]
  },
  {
    id: "pour-over",
    name: "Pour-Over Will Provision",
    status: "optional",
    category: "Estate Planning",
    risk: "MEDIUM",
    description: "Ensures probate assets pour into the trust for unified management and distribution.",
    questionnaire: [
      "Are there probate assets to funnel into the trust?",
      "Should the will direct all residual assets to the trust?",
      "Who should serve as executor?"
    ]
  },
  {
    id: "incentive",
    name: "Incentive Distribution Clause",
    status: "optional",
    category: "Behavioral Incentives",
    risk: "MEDIUM",
    description: "Ties distributions to beneficiary milestones: education completion, employment, or financial responsibility.",
    questionnaire: [
      "Should distributions be tied to education or employment?",
      "What behaviors should trigger or increase distributions?",
      "Should there be financial accountability milestones?"
    ]
  },
  {
    id: "creditor-protection",
    name: "Creditor Protection Clause",
    status: "optional",
    category: "Asset Protection",
    risk: "MEDIUM",
    description: "Protects trust assets from beneficiary creditors through restricted access and trustee controls.",
    questionnaire: [
      "Should creditors be prevented from accessing trust assets?",
      "Should beneficiary creditors have limited claims?",
      "What level of asset protection is needed?"
    ]
  },
  {
    id: "special-needs",
    name: "Special Needs Provision",
    status: "optional",
    category: "Special Circumstances",
    risk: "CRITICAL",
    description: "Protects supplemental needs of disabled beneficiaries without affecting government benefits eligibility.",
    questionnaire: [
      "Are there beneficiaries with special needs or disabilities?",
      "Should provisions protect government benefit eligibility?",
      "Should trustee have special needs expertise requirements?"
    ]
  },
  {
    id: "no-contest",
    name: "No-Contest Clause",
    status: "optional",
    category: "Dispute Prevention",
    risk: "MEDIUM",
    description: "Penalizes beneficiaries who contest the trust, reducing litigation and family disputes.",
    questionnaire: [
      "Should there be penalties for contesting the trust?",
      "What penalty amount or forfeiture is appropriate?",
      "Are there exceptions to the no-contest clause?"
    ]
  },
  {
    id: "trustee-succession",
    name: "Trustee Succession Plan",
    status: "requested",
    category: "Trust Administration",
    risk: "HIGH",
    description: "Clearly defines primary, secondary, and backup trustees with successor appointment mechanisms.",
    questionnaire: [
      "Who is the primary trustee?",
      "Who should serve if primary trustee is unable?",
      "Should successor trustees be family, professional, or both?"
    ]
  },
  {
    id: "tax-apportionment",
    name: "Tax Apportionment Clause",
    status: "optional",
    category: "Tax Planning",
    risk: "LOW",
    description: "Determines how estate and income taxes are paid from trust assets or individual beneficiary distributions.",
    questionnaire: [
      "How should estate taxes be allocated?",
      "Should taxes come from the principal or income?",
      "Should distributions be tax-gross-up protected?"
    ]
  },
  {
    id: "guardian-appointment",
    name: "Guardian Appointment Clause",
    status: "requested",
    category: "Minor Protection",
    risk: "CRITICAL",
    description: "Names guardians for minor children with backup successors and specific care instructions.",
    questionnaire: [
      "Who do you want as guardian for minor children?",
      "Who should serve if primary guardian is unavailable?",
      "Are there special care instructions or preferences?"
    ]
  },
  {
    id: "amendment-procedure",
    name: "Amendment and Modification Clause",
    status: "optional",
    category: "Trust Flexibility",
    risk: "LOW",
    description: "Establishes procedures for amending the trust and conditions allowing modification without full reformation.",
    questionnaire: [
      "Should the trust be easily amendable?",
      "Who should have amendment authority?",
      "What triggers should allow modification?"
    ]
  }
];

export default function LivingTrustFramework() {
  // AUTH STATE
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authStatus, setAuthStatus] = useState({ state: "idle", message: "" });
  const [currentUser, setCurrentUser] = useState(null);

  // FORM STATE
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    state: "CA",
    successorTrustee: "",
    beneficiaries: "",
    distributionPlan: ""
  });

  // TRUST CLAUSES STATE
  const [selectedClauses, setSelectedClauses] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [filterCategory, setFilterCategory] = useState("All");

  // CHECK AUTH ON MOUNT
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentAccount();
        setCurrentUser(user.user);
        setAuthOpen(false);
      } catch (error) {
        setCurrentUser(null);
        setAuthOpen(true);
      }
    };
    checkAuth();
  }, []);

  // UPDATE FORM FIELD
  function updateField(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // SUBMIT AUTH (LOGIN/REGISTER)
  async function submitAuth(e) {
    e.preventDefault();
    const email = form.email.trim();
    const password = form.password?.trim() || "";

    if (!email) {
      setAuthStatus({ state: "error", message: "Email required." });
      return;
    }

    setAuthStatus({ state: "loading", message: authMode === "login" ? "Signing in..." : "Creating account..." });

    try {
      let result;
      if (authMode === "login") {
        result = await loginAccount({ email, password });
      } else {
        result = await registerAccount({ email, password, fullName: form.fullName });
      }

      setCurrentUser(result.user);
      setAuthOpen(false);
      setAuthStatus({ state: "idle", message: "" });
      setForm({ fullName: "", email: "", state: "CA", successorTrustee: "", beneficiaries: "", distributionPlan: "" });
    } catch (error) {
      setAuthStatus({ state: "error", message: error.message });
    }
  }

  // SUBMIT INTAKE FORM - NOW WITH DATABASE SAVE
  async function submitIntake(e) {
    e.preventDefault();

    if (!form.fullName || !form.email) {
      setAuthStatus({ state: "error", message: "Name and email required." });
      return;
    }

    setAuthStatus({ state: "loading", message: "Saving intake..." });

    try {
      // Get current user ID from state
      if (!currentUser || !currentUser.id) {
        setAuthStatus({ state: "error", message: "User not authenticated." });
        return;
      }

      // SAVE TO SUPABASE DATABASE
      await saveIntakeForm(currentUser.id, {
        fullName: form.fullName,
        email: form.email,
        state: form.state,
        successorTrustee: form.successorTrustee,
        beneficiaries: form.beneficiaries,
        distributionPlan: form.distributionPlan
      });

      setAuthStatus({ state: "success", message: "Intake saved successfully!" });
      setTimeout(() => setAuthStatus({ state: "idle", message: "" }), 3000);
    } catch (error) {
      console.error("Error saving intake:", error);
      setAuthStatus({ state: "error", message: "Failed to save intake: " + error.message });
    }
  }

  // SAVE SELECTED CLAUSES
  async function handleSaveClauses() {
    if (!currentUser || !currentUser.id) {
      setAuthStatus({ state: "error", message: "User not authenticated." });
      return;
    }

    try {
      await saveTrustClauses(currentUser.id, selectedClauses);
      setAuthStatus({ state: "success", message: "Clauses saved successfully!" });
      setTimeout(() => setAuthStatus({ state: "idle", message: "" }), 3000);
    } catch (error) {
      console.error("Error saving clauses:", error);
      setAuthStatus({ state: "error", message: "Failed to save clauses: " + error.message });
    }
  }

  // TOGGLE CLAUSE SELECTION
  function toggleClause(clauseId) {
    setSelectedClauses((prev) =>
      prev.includes(clauseId) ? prev.filter((id) => id !== clauseId) : [...prev, clauseId]
    );
  }

  // SIGN OUT
  async function handleSignOut() {
    await signOutAccount();
    setCurrentUser(null);
    setAuthOpen(true);
  }

  // FILTERED CLAUSES
  const filteredClauses =
    filterCategory === "All" ? TRUST_CLAUSES : TRUST_CLAUSES.filter((c) => c.category === filterCategory);

  // CATEGORIES
  const categories = ["All", ...new Set(TRUST_CLAUSES.map((c) => c.category))];

  return (
    <div className="framework">
      {/* NAV */}
      <header className="nav">
        <div className="navContent">
          <h1 className="logo">LT Living Counsel</h1>
          {currentUser && (
            <div className="navUser">
              <span>Welcome, {currentUser.fullName || currentUser.email}</span>
              <button className="signOutBtn" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* AUTH MODAL */}
      {authOpen && (
        <div className="authModal">
          <form className="authPanel" onSubmit={submitAuth}>
            <h2>SIGN IN</h2>
            <p>Sign in to continue your trust intake.</p>
            <div className="formGroup">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                required
              />
            </div>
            <div className="formGroup">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password || ""}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="primaryBtn" disabled={authStatus.state === "loading"}>
              {authStatus.state === "loading" ? "Signing in..." : "Sign In"}
            </button>
            <p className="authToggle">
              Don't have an account?{" "}
              <a
                onClick={() => {
                  setAuthMode("register");
                  setAuthStatus({ state: "idle", message: "" });
                }}
              >
                Create one
              </a>
            </p>
            {authStatus.message && <p className={`status ${authStatus.state}`}>{authStatus.message}</p>}
          </form>
        </div>
      )}

      {/* MAIN CONTENT */}
      {!authOpen && currentUser && (
        <div className="content">
          {/* HERO */}
          <section className="hero">
            <h1>Protect your family plan before probate decides for you.</h1>
            <p>
              Prepare a state-specific living trust package, organize your successor trustee instructions, and create a
              clean review file to discuss with a licensed attorney before signing.
            </p>
            <div className="stats">
              <div className="stat">
                <h3>50</h3>
                <p>State Rule Library</p>
              </div>
              <div className="stat">
                <h3>4</h3>
                <p>Estate Documents</p>
              </div>
              <div className="stat">
                <h3>1 hr</h3>
                <p>Homes-ready File</p>
              </div>
              <div className="stat">
                <h3>1 yr</h3>
                <p>Annual Plan Reminders</p>
              </div>
            </div>
            <button className="ctaBtn" onClick={() => setActiveTab("intake")}>
              Start confidential intake
            </button>
          </section>

          {/* TABS */}
          <section className="tabs">
            <button
              className={`tab ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button className={`tab ${activeTab === "intake" ? "active" : ""}`} onClick={() => setActiveTab("intake")}>
              Intake
            </button>
            <button
              className={`tab ${activeTab === "protections" ? "active" : ""}`}
              onClick={() => setActiveTab("protections")}
            >
              Protections
            </button>
          </section>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <section className="tabContent overview">
              <h2>How It Works</h2>
              <div className="processSteps">
                <div className="step">
                  <h3>1. Build your vault</h3>
                  <p>
                    Answer guided questions by section: childhood, family, work, beliefs, recipes, photos, videos,
                    letters, finances, digital life, and final wishes.
                  </p>
                </div>
                <div className="step">
                  <h3>2. Seal it privately</h3>
                  <p>
                    Your saved profile is tied to your login. You can keep editing until you are ready to seal it for
                    delivery.
                  </p>
                </div>
                <div className="step">
                  <h3>3. Release by death trigger</h3>
                  <p>
                    The death-record monitor checks for a confirmed match. After confirmation and a hold period, the
                    right people receive the right sections.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* INTAKE TAB */}
          {activeTab === "intake" && (
            <section className="tabContent intake">
              <h2>Confidential Intake</h2>
              <p>Your information is private and secure. We'll use this to prepare your estate planning documents.</p>

              <form className="formShell" onSubmit={submitIntake}>
                <div className="formGrid">
                  <div className="formGroup">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={updateField}
                      required
                    />
                  </div>

                  <div className="formGroup">
                    <label>Email</label>
                    <input type="email" name="email" value={form.email} onChange={updateField} required />
                  </div>

                  <div className="formGroup">
                    <label>State</label>
                    <select name="state" value={form.state} onChange={updateField}>
                      <option value="CA">CA</option>
                      <option value="NY">NY</option>
                      <option value="TX">TX</option>
                      <option value="FL">FL</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label>Successor Trustee</label>
                    <input
                      type="text"
                      name="successorTrustee"
                      value={form.successorTrustee}
                      onChange={updateField}
                      placeholder="Name and relationship"
                    />
                  </div>

                  <div className="formGroup">
                    <label>Beneficiaries</label>
                    <textarea
                      name="beneficiaries"
                      value={form.beneficiaries}
                      onChange={updateField}
                      placeholder="Names, relationships, and share amounts"
                    />
                  </div>

                  <div className="formGroup">
                    <label>Distribution Plan</label>
                    <textarea
                      name="distributionPlan"
                      value={form.distributionPlan}
                      onChange={updateField}
                      placeholder="How and when should assets be distributed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="primaryBtn"
                  style={{ marginTop: "24px" }}
                  disabled={authStatus.state === "loading"}
                >
                  {authStatus.state === "loading" ? "Saving..." : "Submit Intake"}
                </button>

                {authStatus.message && <p className={`status ${authStatus.state}`}>{authStatus.message}</p>}
              </form>
            </section>
          )}

          {/* PROTECTIONS TAB */}
          {activeTab === "protections" && (
            <section className="tabContent protections">
              <h2>Trust Protections</h2>
              <p>{selectedClauses.length} CRITICAL protections need review</p>

              <div className="filterBar">
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="clausesGrid">
                {filteredClauses.map((clause) => (
                  <div key={clause.id} className="clauseCard">
                    <input
                      type="checkbox"
                      checked={selectedClauses.includes(clause.id)}
                      onChange={() => toggleClause(clause.id)}
                    />
                    <h3>{clause.name}</h3>
                    <p className={`risk ${clause.risk.toLowerCase()}`}>{clause.risk}</p>
                    <p>{clause.description}</p>
                    <div className="questionnaire">
                      {clause.questionnaire.map((q, idx) => (
                        <p key={idx}>• {q}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button className="primaryBtn" onClick={handleSaveClauses} style={{ marginTop: "24px" }}>
                Save Selected Protections
              </button>
            </section>
          )}
        </div>
      )}
    </div>
  );
}