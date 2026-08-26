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

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

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
    } catch (error) {
      console.error("Error saving package:", error);
      setStatus({ state: "error", message: "Failed to save: " + error.message });
    }
  }

  return (
    <main>
      <section className="hero" style={{ backgroundImage: `url("${asset("/images/trust-hero.png")}")` }}>
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
          <p>Professional estate planning workflow</p>
        </section>
      )}

      {activeTab === "start" && (
        <section className="workspace">
          <h2>Intake Form</h2>
          <form onSubmit={submitPackage}>
            <input type="text" name="fullName" placeholder="Full Name" value={form.fullName} onChange={updateField} required />
            <input type="email" name="email" placeholder="Email" value={form.email} onChange={updateField} required />
            <select name="state" value={form.state} onChange={updateField}>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select>
            <textarea name="successorTrustee" placeholder="Successor Trustee" value={form.successorTrustee} onChange={updateField} />
            <textarea name="beneficiaries" placeholder="Beneficiaries" value={form.beneficiaries} onChange={updateField} />
            <textarea name="distributionPlan" placeholder="Distribution Plan" value={form.distributionPlan} onChange={updateField} />
            <button type="submit" className="primary">Save Intake</button>
            {status.message && <p className={`status ${status.state}`}>{status.message}</p>}
          </form>
        </section>
      )}

      {activeTab === "clauses" && (
        <section className="workspace">
          <h2>Trust Protections</h2>
          <div className="clausesList">
            {filtered.map(clause => (
              <div key={clause.id} className="clauseItem">
                <input type="checkbox" checked={selected.includes(clause.id)} onChange={() => toggleClause(clause.id)} />
                <h3>{clause.name}</h3>
                <p>{clause.description}</p>
              </div>
            ))}
          </div>
          <button className="primary" onClick={submitPackage}>Save Clauses</button>
        </section>
      )}

      {activeTab === "legal" && (
        <section className="workspace">
          <h2>Legal Review</h2>
          <p>Review your trust documents with a licensed attorney</p>
        </section>
      )}

      {activeTab === "resources" && (
        <section className="workspace">
          <h2>Resources & Guides</h2>
          <p>State-specific resources and attorney referrals</p>
        </section>
      )}

      {activeTab === "command" && (
        <section className="workspace">
          <h2>Case Desk</h2>
          <p>Manage your trust accounts and documents</p>
        </section>
      )}

      {activeTab === "marketing" && (
        <section className="workspace">
          <h2>Marketing</h2>
          <p>Sharing and growth tools</p>
        </section>
      )}
    </main>
  );
}