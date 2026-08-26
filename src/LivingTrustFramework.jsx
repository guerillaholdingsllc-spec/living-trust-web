import React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  getCurrentAccount,
  loginAccount,
  registerAccount,
  requestPasswordReset
} from "./api.js";
import { saveIntakeForm, saveTrustClauses } from "./trustData.js";

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
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

const STATE_RESOURCES = {
  "CA": {
    attorneys: ["California State Bar - Referral Service", "San Francisco Bar Association"],
    guides: "California Trust Law, Probate Code §13050+",
    requirements: "Notarization required, self-proving affidavit recommended"
  },
  "TX": {
    attorneys: ["State Bar of Texas - Lawyer Referral", "Houston Bar Association"],
    guides: "Texas Trust Code (Property Code §111+)",
    requirements: "No notarization required, but recommended"
  },
  "NY": {
    attorneys: ["New York State Bar Association", "NYC Bar Association"],
    guides: "New York Surrogate's Court Procedure Act",
    requirements: "Notarization required for valid execution"
  },
  "FL": {
    attorneys: ["Florida Bar - Lawyer Referral Service", "Miami-Dade County Bar"],
    guides: "Florida Probate Code (Chapter 737)",
    requirements: "Notarization and witness requirements apply"
  }
};

export default function LivingTrustFramework() {
  const path = window.location.pathname.toLowerCase();
  const isGeneratorRoute = path.includes("/livingtrust");
  const params = new URLSearchParams(window.location.search);
  const returnNotice = params.get("trustId")
    ? `Trust intake ${params.get("trustId")} was received. Attorney review and document delivery require the production backend credentials to be configured.`
    : "";

  const [activeTab, setActiveTab] = useState(isGeneratorRoute ? "start" : "landing");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("livingtrust_user") || "null");
    } catch (_error) {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState("login");
  const [authOpen, setAuthOpen] = useState(isGeneratorRoute && !user);
  const [authForm, setAuthForm] = useState({ fullName: "", email: "", password: "" });
  const [authStatus, setAuthStatus] = useState({ state: "idle", message: "" });

  const [accountTrusts, setAccountTrusts] = useState([]);
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState("incapacity");
  const [selected, setSelected] = useState(() => TRUST_CLAUSES.map((c) => c.id));
  const [selectedTier, setSelectedTier] = useState("base");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    state: "CA",
    address: "",
    trustType: "Individual revocable living trust",
    successorTrustee: "",
    beneficiaries: "",
    distributionPlan: "",
    assetSummary: "",
    realEstate: "",
    bankAccounts: "",
    investmentAccounts: "",
    retirementAccounts: "",
    lifeInsurance: "",
    vehicles: "",
    businessInterests: "",
    firearms: "",
    jewelryValuables: "",
    digitalAssets: "",
    debtsLiabilities: "",
    safeDepositStorage: "",
    beneficiaryDesignations: "",
    excludedAssets: "",
    specialInstructions: ""
  });

  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [savedDocuments, setSavedDocuments] = useState([
    { id: 1, name: "Intake Form - John Doe", date: "Aug 26, 2024", status: "In Progress", type: "intake" },
    { id: 2, name: "Trust Clauses Selection", date: "Aug 26, 2024", status: "Completed", type: "clauses" }
  ]);

  const filtered = category === "All" ? TRUST_CLAUSES : TRUST_CLAUSES.filter((c) => c.category === category);
  const selectedClauses = useMemo(() => TRUST_CLAUSES.filter((c) => selected.includes(c.id)), [selected]);

  useEffect(() => {
    const token = localStorage.getItem("livingtrust_token");
    if (!token) return;

    getCurrentAccount()
      .then(({ user: account }) => {
        setUser(account);
        setForm((current) => ({
          ...current,
          fullName: current.fullName || account?.fullName || "",
          email: current.email || account?.email || ""
        }));
        setAccountTrusts([]);
      })
      .catch(() => {
        localStorage.removeItem("livingtrust_token");
        localStorage.removeItem("livingtrust_user");
        setUser(null);
        if (isGeneratorRoute) setAuthOpen(true);
      });
  }, [isGeneratorRoute]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateAuthField(event) {
    setAuthForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthStatus({
      state: "loading",
      message: authMode === "register" ? "Creating account..." : "Signing in..."
    });

    try {
      const action = authMode === "register" ? registerAccount : loginAccount;
      const { user: account } = await action(authForm);

      setUser(account);
      setAuthOpen(false);
      setAuthStatus({ state: "success", message: "Signed in." });

      setForm((current) => ({
        ...current,
        fullName: current.fullName || account?.fullName || authForm.fullName || "",
        email: current.email || account?.email || authForm.email || ""
      }));

      setAccountTrusts([]);
      if (!isGeneratorRoute) window.location.href = "/livingtrust/";
    } catch (error) {
      setAuthStatus({ state: "error", message: error.message });
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
      setAuthStatus({ state: "error", message: error.message });
    }
  }

  function signOut() {
    localStorage.removeItem("livingtrust_token");
    localStorage.removeItem("livingtrust_user");
    setUser(null);
    setAccountTrusts([]);
    if (isGeneratorRoute) setAuthOpen(true);
  }

  function startIntake() {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!isGeneratorRoute) window.location.href = "/livingtrust/";
    else setActiveTab("start");
  }

  function toggleClause(id) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function submitPackage(event) {
    event.preventDefault();

    if (!user || !user.id) {
      setStatus({ state: "error", message: "User not authenticated." });
      return;
    }

    setStatus({ state: "loading", message: "Saving your intake..." });

    try {
      await saveIntakeForm(user.id, {
        fullName: form.fullName,
        email: form.email,
        state: form.state,
        address: form.address,
        trustType: form.trustType,
        successorTrustee: form.successorTrustee,
        beneficiaries: form.beneficiaries,
        distributionPlan: form.distributionPlan,
        assetSummary: form.assetSummary,
        realEstate: form.realEstate,
        bankAccounts: form.bankAccounts,
        investmentAccounts: form.investmentAccounts,
        retirementAccounts: form.retirementAccounts,
        lifeInsurance: form.lifeInsurance,
        vehicles: form.vehicles,
        businessInterests: form.businessInterests,
        firearms: form.firearms,
        jewelryValuables: form.jewelryValuables,
        digitalAssets: form.digitalAssets,
        debtsLiabilities: form.debtsLiabilities,
        safeDepositStorage: form.safeDepositStorage,
        beneficiaryDesignations: form.beneficiaryDesignations,
        excludedAssets: form.excludedAssets,
        specialInstructions: form.specialInstructions
      });

      await saveTrustClauses(user.id, selected);

      setStatus({
        state: "success",
        message: "Intake saved successfully! Document generation coming soon."
      });

      setSavedDocuments([
        { id: Date.now(), name: "Intake Form - " + form.fullName, date: new Date().toLocaleDateString(), status: "Completed", type: "intake" },
        ...savedDocuments
      ]);
    } catch (error) {
      console.error("Error saving package:", error);
      setStatus({ state: "error", message: "Failed to save: " + error.message });
    }
  }

  const stateInfo = STATE_RESOURCES[form.state] || {
    attorneys: ["State Bar Association", "Local Bar Association"],
    guides: "Consult with state bar for specific requirements",
    requirements: "Consult with licensed attorney"
  };

  return (
    <main>
      <section className="hero" style={{ backgroundImage: `url("/images/trust-hero.png")` }}>
        <div className="heroShade" />

        <nav className="nav">
          <div className="brand">
            <span className="brandMark">LT</span>
            <span>LivingTrust Counsel</span>
          </div>

          <div className="navLinks">
            <button onClick={() => setActiveTab("landing")}>Overview</button>
            <button onClick={startIntake}>Intake</button>
            <button onClick={() => setActiveTab("clauses")}>Protections</button>
            <button onClick={() => setActiveTab("legal")}>Review</button>
            <button onClick={() => setActiveTab("resources")}>Resources</button>
            <button onClick={() => setActiveTab("command")}>Case Desk</button>
            <button onClick={() => setActiveTab("marketing")}>Marketing</button>
            {user ? <button onClick={signOut}>Sign Out</button> : <button onClick={() => setAuthOpen(true)}>Sign In</button>}
          </div>
        </nav>

        <div className="heroContent">
          <span className="eyebrow">Estate planning document preparation with attorney-ready files</span>
          <h1>Protect your family plan before probate decides for you.</h1>
          <p>
            Prepare a state-specific living trust package, organize your successor trustee instructions, and create a
            clean review file to discuss with a licensed attorney before signing.
          </p>

          <div className="heroActions">
            <button className="primary" onClick={startIntake}>Start confidential intake</button>
            <button className="secondary" onClick={() => setActiveTab("landing")}>Review the process</button>
          </div>

          <div className="heroCredentials">
            <span>Revocable living trust</span>
            <span>Pour-over will</span>
            <span>Certificate of trust</span>
            <span>Funding instructions</span>
          </div>
        </div>
      </section>

      {returnNotice && (
        <section className="workspace">
          <div className="noticePanel">
            <strong>Submission received</strong>
            <p>{returnNotice}</p>
          </div>
        </section>
      )}

      {user && (
        <section className="accountBar">
          <div>
            <strong>{user.fullName || user.email}</strong>
            <span>{accountTrusts.length} saved trust{accountTrusts.length === 1 ? "" : "s"}</span>
          </div>
          <button className="quietButton" onClick={startIntake}>Continue intake</button>
        </section>
      )}

      {authOpen && (
        <div className="authOverlay">
          <form className="authPanel" onSubmit={submitAuth}>
            <button type="button" className="authClose" onClick={() => !isGeneratorRoute && setAuthOpen(false)}>×</button>
            <span className="eyebrow dark">{authMode === "register" ? "Create account" : "Sign in"}</span>
            <h2>{authMode === "register" ? "Create your private trust account." : "Sign in to continue your trust intake."}</h2>
            <p>Your account saves your intake and connects completed trust packages to your profile.</p>
            {authMode === "register" && (
              <label>Full name<input name="fullName" value={authForm.fullName} onChange={updateAuthField} autoComplete="name" /></label>
            )}
            <label>Email<input required type="email" name="email" value={authForm.email} onChange={updateAuthField} autoComplete="email" /></label>
            <label>Password<input required type="password" name="password" value={authForm.password} onChange={updateAuthField} autoComplete={authMode === "register" ? "new-password" : "current-password"} /></label>
            <button className="primary" disabled={authStatus.state === "loading"}>{authMode === "register" ? "Create Account" : "Sign In"}</button>
            <button type="button" className="quietButton" onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}>
              {authMode === "register" ? "I already have an account" : "Create an account"}
            </button>
            <button type="button" className="linkButton" onClick={sendResetEmail}>Forgot password?</button>
            {authStatus.message && <p className={`status ${authStatus.state}`}>{authStatus.message}</p>}
          </form>
        </div>
      )}

      {activeTab === "landing" && (
        <section className="workspace">
          <h2>Living Trust Overview</h2>
          <p className="subtitle">Professional estate planning workflow with attorney-ready documents</p>
          
          <div className="overviewGrid">
            <div className="overviewCard">
              <h3>📋 Step 1: Intake</h3>
              <p>Tell us about your family, assets, and wishes. Our questionnaire captures everything attorneys need to draft your trust.</p>
            </div>
            <div className="overviewCard">
              <h3>🛡️ Step 2: Protections</h3>
              <p>Select trust clauses that protect your family. We explain each protection and help you choose what matters most.</p>
            </div>
            <div className="overviewCard">
              <h3>📝 Step 3: Review</h3>
              <p>Review your complete trust document summary. Prepare talking points for your attorney before signing.</p>
            </div>
            <div className="overviewCard">
              <h3>✍️ Step 4: Sign & Fund</h3>
              <p>Get funding instructions to transfer assets into your trust. Includes templates and guidance for each asset type.</p>
            </div>
          </div>

          <div className="overviewFeatures">
            <h3>What You Get</h3>
            <ul>
              <li>✅ State-specific trust document (revocable living trust)</li>
              <li>✅ Pour-over will for assets outside the trust</li>
              <li>✅ Certificate of trust (for bank/brokerage transfers)</li>
              <li>✅ Successor trustee instruction letter</li>
              <li>✅ Asset funding checklist and templates</li>
              <li>✅ Attorney review file with your selections</li>
            </ul>
          </div>
        </section>
      )}

      {activeTab === "start" && (
        <section className="workspace">
          <h2>Intake Form</h2>
          <form onSubmit={submitPackage}>
            <div className="formSection">
              <h3>Personal Information</h3>
              <input type="text" name="fullName" placeholder="Full Name" value={form.fullName} onChange={updateField} required />
              <input type="email" name="email" placeholder="Email" value={form.email} onChange={updateField} required />
              <select name="state" value={form.state} onChange={updateField}>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select>
              <input type="text" name="address" placeholder="Address" value={form.address} onChange={updateField} />
            </div>

            <div className="formSection">
              <h3>Trust Structure</h3>
              <select name="trustType" value={form.trustType} onChange={updateField}>
                <option value="Individual revocable living trust">Individual revocable living trust</option>
                <option value="Joint marital trust">Joint marital trust</option>
                <option value="Family trust">Family trust</option>
                <option value="Irrevocable trust">Irrevocable trust</option>
              </select>
            </div>

            <div className="formSection">
              <h3>Key Roles & Distribution</h3>
              <textarea name="successorTrustee" placeholder="Who will be your successor trustee?" value={form.successorTrustee} onChange={updateField} />
              <textarea name="beneficiaries" placeholder="List your beneficiaries" value={form.beneficiaries} onChange={updateField} />
              <textarea name="distributionPlan" placeholder="How should assets be distributed?" value={form.distributionPlan} onChange={updateField} />
            </div>

            <div className="formSection">
              <h3>Assets Overview</h3>
              <textarea name="realEstate" placeholder="Real estate (homes, rental properties, land)" value={form.realEstate} onChange={updateField} />
              <textarea name="bankAccounts" placeholder="Bank and investment accounts" value={form.bankAccounts} onChange={updateField} />
              <textarea name="lifeInsurance" placeholder="Life insurance policies" value={form.lifeInsurance} onChange={updateField} />
              <textarea name="digitalAssets" placeholder="Cryptocurrency, online accounts, NFTs" value={form.digitalAssets} onChange={updateField} />
              <textarea name="specialInstructions" placeholder="Any special wishes or instructions" value={form.specialInstructions} onChange={updateField} />
            </div>

            <button type="submit" className="primary">Save Intake Form</button>
            {status.message && <p className={`status ${status.state}`}>{status.message}</p>}
          </form>
        </section>
      )}

      {activeTab === "clauses" && (
        <section className="workspace">
          <h2>Trust Protections</h2>
          <p className="subtitle">Select which clauses to include in your trust</p>

          <div className="filterBar">
            <label>Filter by category:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="clausesList">
            {filtered.map(clause => (
              <div key={clause.id} className={`clauseItem ${selected.includes(clause.id) ? 'selected' : ''}`}>
                <div className="clauseHeader">
                  <input 
                    type="checkbox" 
                    checked={selected.includes(clause.id)} 
                    onChange={() => toggleClause(clause.id)} 
                  />
                  <div className="clauseInfo">
                    <h3>{clause.name}</h3>
                    <span className={`riskBadge ${clause.risk.toLowerCase()}`}>{clause.risk}</span>
                    <span className="categoryTag">{clause.category}</span>
                  </div>
                </div>
                <p className="clauseDesc">{clause.description}</p>
                {selected.includes(clause.id) && (
                  <div className="clauseQuestionnaire">
                    <p className="questLabel">Key questions:</p>
                    <ul>
                      {clause.questionnaire.map((q, idx) => <li key={idx}>{q}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="clausesSummary">
            <h3>Selection Summary</h3>
            <p>{selected.length} clauses selected</p>
            <div className="selectedList">
              {selectedClauses.map(c => (
                <span key={c.id} className="clausePill">{c.name} ✓</span>
              ))}
            </div>
          </div>

          <button className="primary" onClick={submitPackage}>Save Clause Selection</button>
        </section>
      )}

      {activeTab === "legal" && (
        <section className="workspace">
          <h2>Legal Review</h2>
          <p className="subtitle">Review your trust document summary before attorney consultation</p>

          <div className="reviewPanel">
            <h3>Your Intake Summary</h3>
            <div className="reviewSection">
              <h4>Grantor Information</h4>
              <div className="reviewField">
                <label>Full Name:</label>
                <p>{form.fullName || "Not provided"}</p>
              </div>
              <div className="reviewField">
                <label>State of Domicile:</label>
                <p>{form.state}</p>
              </div>
              <div className="reviewField">
                <label>Successor Trustee:</label>
                <p>{form.successorTrustee || "Not provided"}</p>
              </div>
            </div>

            <div className="reviewSection">
              <h4>Beneficiaries & Distribution</h4>
              <div className="reviewField">
                <label>Beneficiaries:</label>
                <p>{form.beneficiaries || "Not provided"}</p>
              </div>
              <div className="reviewField">
                <label>Distribution Plan:</label>
                <p>{form.distributionPlan || "Not provided"}</p>
              </div>
            </div>

            <div className="reviewSection">
              <h4>Selected Protections ({selected.length} clauses)</h4>
              <div className="selectedClauses">
                {selectedClauses.map(c => (
                  <div key={c.id} className="selectedClause">
                    <strong>{c.name}</strong>
                    <span className="riskBadge">{c.risk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="reviewActions">
              <button className="secondary" onClick={() => setActiveTab("start")}>Edit Intake</button>
              <button className="secondary" onClick={() => setActiveTab("clauses")}>Edit Clauses</button>
              <button className="primary">Download Review Document</button>
            </div>
          </div>

          <div className="nextSteps">
            <h3>Next Steps</h3>
            <ol>
              <li>Review this document with a licensed estate planning attorney</li>
              <li>Make any changes to your selections</li>
              <li>Execute the trust documents with proper notarization</li>
              <li>Use our funding checklist to transfer assets into the trust</li>
              <li>Store the trust document safely (typically with your attorney)</li>
            </ol>
          </div>
        </section>
      )}

      {activeTab === "resources" && (
        <section className="workspace">
          <h2>Resources & Guides</h2>
          <p className="subtitle">State-specific information and attorney referrals</p>

          <div className="resourcesGrid">
            <div className="resourceCard">
              <h3>📋 {form.state} Trust Law Requirements</h3>
              <div className="resourceContent">
                <p><strong>Law Reference:</strong> {stateInfo.guides}</p>
                <p><strong>Execution Requirements:</strong> {stateInfo.requirements}</p>
              </div>
            </div>

            <div className="resourceCard">
              <h3>⚖️ Find an Attorney</h3>
              <div className="resourceContent">
                <p>Recommended bar associations for {form.state}:</p>
                <ul>
                  {stateInfo.attorneys.map((attorney, idx) => <li key={idx}>{attorney}</li>)}
                </ul>
                <p className="resourceHint">Call your state bar for certified estate planning specialists in your area.</p>
              </div>
            </div>

            <div className="resourceCard">
              <h3>📚 Learning Resources</h3>
              <div className="resourceContent">
                <ul>
                  <li><strong>Revocable vs. Irrevocable:</strong> Understand when each is appropriate</li>
                  <li><strong>Pour-Over Will:</strong> How it works with your trust</li>
                  <li><strong>Funding Your Trust:</strong> Step-by-step asset transfer guide</li>
                  <li><strong>Beneficiary Designations:</strong> How they interact with your trust</li>
                  <li><strong>Tax Planning:</strong> Estate and gift tax considerations</li>
                </ul>
              </div>
            </div>

            <div className="resourceCard">
              <h3>🔍 Key Definitions</h3>
              <div className="resourceContent">
                <dl>
                  <dt><strong>Grantor:</strong></dt>
                  <dd>The person creating the trust (you)</dd>
                  
                  <dt><strong>Trustee:</strong></dt>
                  <dd>The person managing trust assets</dd>
                  
                  <dt><strong>Successor Trustee:</strong></dt>
                  <dd>Who takes over after you die or become incapacitated</dd>
                  
                  <dt><strong>Beneficiary:</strong></dt>
                  <dd>Who receives assets from the trust</dd>
                </dl>
              </div>
            </div>

            <div className="resourceCard">
              <h3>✅ Funding Checklist</h3>
              <div className="resourceContent">
                <p>After signing, you'll need to transfer assets:</p>
                <ul>
                  <li>☐ Real estate (deed transfer)</li>
                  <li>☐ Bank accounts (new account in trust name)</li>
                  <li>☐ Investments (retitle with brokerage)</li>
                  <li>☐ Life insurance (change beneficiary to trust)</li>
                  <li>☐ Vehicles (DMV title transfer)</li>
                  <li>☐ Business interests (operating agreement update)</li>
                </ul>
              </div>
            </div>

            <div className="resourceCard">
              <h3>⚠️ Common Mistakes to Avoid</h3>
              <div className="resourceContent">
                <ul>
                  <li>🚫 Signing without notarization (where required)</li>
                  <li>🚫 Not funding the trust after signing</li>
                  <li>🚫 Naming minors as direct beneficiaries</li>
                  <li>🚫 Forgetting to update beneficiary designations</li>
                  <li>🚫 Not reviewing the trust every 3-5 years</li>
                  <li>🚫 Keeping the trust document in a safe deposit box (inaccessible after death)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "command" && (
        <section className="workspace">
          <h2>Case Desk</h2>
          <p className="subtitle">Manage your trust documents and track progress</p>

          {!user ? (
            <div className="emptyState">
              <p>Sign in to view and manage your saved trusts.</p>
              <button className="primary" onClick={() => setAuthOpen(true)}>Sign In</button>
            </div>
          ) : (
            <>
              <div className="dashboardStats">
                <div className="statCard">
                  <h4>Total Trusts</h4>
                  <p className="statValue">{savedDocuments.length}</p>
                </div>
                <div className="statCard">
                  <h4>In Progress</h4>
                  <p className="statValue">{savedDocuments.filter(d => d.status === "In Progress").length}</p>
                </div>
                <div className="statCard">
                  <h4>Completed</h4>
                  <p className="statValue">{savedDocuments.filter(d => d.status === "Completed").length}</p>
                </div>
              </div>

              <div className="documentsTable">
                <h3>Your Saved Documents</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Type</th>
                      <th>Date Saved</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedDocuments.map(doc => (
                      <tr key={doc.id}>
                        <td>{doc.name}</td>
                        <td>{doc.type === 'intake' ? 'Intake Form' : 'Clause Selection'}</td>
                        <td>{doc.date}</td>
                        <td><span className={`statusBadge ${doc.status.toLowerCase().replace(' ', '')}`}>{doc.status}</span></td>
                        <td>
                          <button className="tableBtn">View</button>
                          <button className="tableBtn">Download</button>
                          <button className="tableBtn">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="caseActions">
                <h3>Quick Actions</h3>
                <div className="actionGrid">
                  <button className="actionBtn" onClick={() => setActiveTab("start")}>📝 Start New Trust</button>
                  <button className="actionBtn">📥 Import Existing Trust</button>
                  <button className="actionBtn">📧 Share with Attorney</button>
                  <button className="actionBtn">⬇️ Download All Documents</button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {activeTab === "marketing" && (
        <section className="workspace">
          <h2>Share Your Plan</h2>
          <p className="subtitle">Invite family members and refer friends</p>

          <div className="marketingGrid">
            <div className="marketingCard">
              <h3>👨‍👩‍👧‍👦 Share with Family</h3>
              <p>Give your family members access to your trust summary and instructions.</p>
              <div className="shareOptions">
                <input type="email" placeholder="Family member email" />
                <select>
                  <option value="viewer">View only</option>
                  <option value="editor">Can edit</option>
                  <option value="admin">Admin access</option>
                </select>
                <button className="primary">Send Invite</button>
              </div>
            </div>

            <div className="marketingCard">
              <h3>🔗 Share Your Referral Link</h3>
              <p>Refer friends and earn rewards when they complete their trust.</p>
              <div className="referralSection">
                <input type="text" value="https://living-trust-web.onrender.com/?ref=SYDNEY123" readOnly />
                <button className="secondary">Copy Link</button>
              </div>
              <p className="referralText">You have referred: <strong>3 friends</strong></p>
            </div>

            <div className="marketingCard">
              <h3>📱 Share on Social Media</h3>
              <p>Spread the word about estate planning.</p>
              <div className="socialSharing">
                <button className="socialBtn facebook">📘 Facebook</button>
                <button className="socialBtn twitter">𝕏 Twitter</button>
                <button className="socialBtn linkedin">💼 LinkedIn</button>
                <button className="socialBtn email">✉️ Email</button>
              </div>
            </div>

            <div className="marketingCard">
              <h3>✍️ Email to Attorney</h3>
              <p>Send your complete trust intake to your attorney for review.</p>
              <div className="attorneyShare">
                <input type="email" placeholder="Attorney email address" />
                <select>
                  <option value="intake">Intake Form Only</option>
                  <option value="all">Complete Package</option>
                </select>
                <button className="primary">Send Package</button>
              </div>
            </div>

            <div className="marketingCard">
              <h3>📋 Print or PDF</h3>
              <p>Download your trust summary as a PDF for offline storage.</p>
              <div className="downloadOptions">
                <button className="secondary">📄 Download PDF</button>
                <button className="secondary">🖨️ Print Summary</button>
              </div>
            </div>

            <div className="marketingCard">
              <h3>🎯 Referral Rewards</h3>
              <p>Get benefits when you refer others:</p>
              <ul className="rewardsList">
                <li>✓ 1 referral = $50 credit</li>
                <li>✓ 3 referrals = Free attorney consultation</li>
                <li>✓ 5+ referrals = Premium member perks</li>
              </ul>
            </div>
          </div>

          <div className="shareTemplate">
            <h3>Share Message Template</h3>
            <textarea defaultValue="Hey! I just set up my living trust to protect my family. If you haven't done this yet, it's easier than you think. Check out this tool: [your referral link]">
            </textarea>
            <button className="secondary">Copy Message</button>
          </div>
        </section>
      )}
    </main>
  );
}
