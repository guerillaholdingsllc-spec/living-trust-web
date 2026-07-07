import { useMemo, useState } from "react";
import { generateTrust, getIntakeAssist, getLeadBrief, getOperationsBrief, saveIntakeDraft, startMaintenanceSubscription } from "./api.js";

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
const STATES = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

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
  {
    id: "base",
    name: "Base Trust Prep",
    price: "$397",
    note: "One-time",
    description: "Guided intake, asset inventory, review-ready document packet, funding checklist, and state execution notes.",
    cta: "Generate base package"
  },
  {
    id: "family",
    name: "Family Trust Prep",
    price: "$997",
    note: "One-time",
    description: "Expanded intake for couples, blended families, minor children, multiple asset classes, and trustee instructions.",
    cta: "Generate family package"
  },
  {
    id: "maintenance",
    name: "Annual Maintenance",
    price: "$149",
    note: "Per year",
    description: "Annual asset refresh, beneficiary review reminders, trust update prompts, and organized change history.",
    cta: "Start annual maintenance"
  }
];

const STATE_RESOURCES = [
  ["AL", "Alabama", "alabama"], ["AK", "Alaska", "alaska"], ["AZ", "Arizona", "arizona"], ["AR", "Arkansas", "arkansas"], ["CA", "California", "california"],
  ["CO", "Colorado", "colorado"], ["CT", "Connecticut", "connecticut"], ["DE", "Delaware", "delaware"], ["FL", "Florida", "florida"], ["GA", "Georgia", "georgia"],
  ["HI", "Hawaii", "hawaii"], ["ID", "Idaho", "idaho"], ["IL", "Illinois", "illinois"], ["IN", "Indiana", "indiana"], ["IA", "Iowa", "iowa"],
  ["KS", "Kansas", "kansas"], ["KY", "Kentucky", "kentucky"], ["LA", "Louisiana", "louisiana"], ["ME", "Maine", "maine"], ["MD", "Maryland", "maryland"],
  ["MA", "Massachusetts", "massachusetts"], ["MI", "Michigan", "michigan"], ["MN", "Minnesota", "minnesota"], ["MS", "Mississippi", "mississippi"], ["MO", "Missouri", "missouri"],
  ["MT", "Montana", "montana"], ["NE", "Nebraska", "nebraska"], ["NV", "Nevada", "nevada"], ["NH", "New Hampshire", "new-hampshire"], ["NJ", "New Jersey", "new-jersey"],
  ["NM", "New Mexico", "new-mexico"], ["NY", "New York", "new-york"], ["NC", "North Carolina", "north-carolina"], ["ND", "North Dakota", "north-dakota"], ["OH", "Ohio", "ohio"],
  ["OK", "Oklahoma", "oklahoma"], ["OR", "Oregon", "oregon"], ["PA", "Pennsylvania", "pennsylvania"], ["RI", "Rhode Island", "rhode-island"], ["SC", "South Carolina", "south-carolina"],
  ["SD", "South Dakota", "south-dakota"], ["TN", "Tennessee", "tennessee"], ["TX", "Texas", "texas"], ["UT", "Utah", "utah"], ["VT", "Vermont", "vermont"],
  ["VA", "Virginia", "virginia"], ["WA", "Washington", "washington"], ["WV", "West Virginia", "west-virginia"], ["WI", "Wisconsin", "wisconsin"], ["WY", "Wyoming", "wyoming"]
].map(([code, name, slug]) => ({
  code,
  name,
  guide: `https://www.findlaw.com/state/${slug}-law.html`,
  findLaw: `https://lawyers.findlaw.com/estate-planning/${slug}/`,
  justia: `https://www.justia.com/lawyers/estate-planning/${slug}`,
  superLawyers: `https://attorneys.superlawyers.com/estate-planning-and-probate/${slug}/`,
  avvo: `https://www.avvo.com/estate-planning-lawyer/${code.toLowerCase()}.html`,
  google: `https://www.google.com/search?q=${encodeURIComponent(`${name} living trust estate planning attorney`)}`,
  aba: "https://www.americanbar.org/groups/lawyer_referral/resources/lawyer-referral-directory/"
}));

const riskClass = {
  CRITICAL: "risk critical",
  HIGH: "risk high",
  MEDIUM: "risk medium",
  LOW: "risk low"
};

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export default function LivingTrustFramework() {
  const params = new URLSearchParams(window.location.search);
  const returnNotice = params.get("trustId")
    ? `Trust intake ${params.get("trustId")} was received. Attorney review and document delivery require the production backend credentials to be configured.`
    : "";
  const [activeTab, setActiveTab] = useState("start");
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
  const [assistant, setAssistant] = useState({ state: "idle", data: null, message: "" });
  const [opsBrief, setOpsBrief] = useState({ state: "idle", data: null, message: "" });
  const [leadBrief, setLeadBrief] = useState({ state: "idle", data: null, message: "" });
  const [growthInput, setGrowthInput] = useState({
    market: "California",
    audience: "homeowners, parents, business owners, and families who want to avoid probate"
  });

  const filtered = category === "All" ? TRUST_CLAUSES : TRUST_CLAUSES.filter((c) => c.category === category);
  const criticalCount = TRUST_CLAUSES.filter((c) => c.risk === "CRITICAL").length;
  const selectedClauses = useMemo(() => TRUST_CLAUSES.filter((c) => selected.includes(c.id)), [selected]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function toggleClause(id) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function buildAssetSchedule() {
    return ASSET_INTAKE_FIELDS
      .map(([key, label]) => ({
        type: label,
        description: form[key].trim()
      }))
      .filter((asset) => asset.description);
  }

  async function submitPackage(event) {
    event.preventDefault();
    if (selectedTier === "maintenance") {
      await startMaintenanceCheckout();
      return;
    }
    setStatus({ state: "loading", message: "Generating your review-ready document preparation package..." });
    try {
      const result = await generateTrust({
        grantor: {
          fullName: form.fullName,
          email: form.email,
          state: form.state,
          address: form.address
        },
        questionnaire: {
          trustType: form.trustType,
          successorTrustee: form.successorTrustee,
          beneficiaries: form.beneficiaries,
          distributionPlan: form.distributionPlan,
          beneficiaryDesignations: form.beneficiaryDesignations,
          excludedAssets: form.excludedAssets,
          specialInstructions: form.specialInstructions
        },
        clauses: selectedClauses.map((clause) => clause.name),
        assets: [
          ...(form.assetSummary ? [{ type: "General asset inventory", description: form.assetSummary }] : []),
          ...buildAssetSchedule()
        ],
        packageType: selectedTier,
        previewAccepted: true
      });
      setStatus({ state: "success", message: result.message });
      if (result.checkoutUrl) window.location.href = result.checkoutUrl;
    } catch (error) {
      setStatus({ state: "error", message: error.message });
    }
  }

  async function startMaintenanceCheckout() {
    setStatus({ state: "loading", message: "Opening annual maintenance checkout..." });
    try {
      const result = await startMaintenanceSubscription({
        email: form.email,
        fullName: form.fullName,
        state: form.state
      });
      setStatus({ state: "success", message: result.message });
      if (result.checkoutUrl) window.location.href = result.checkoutUrl;
    } catch (error) {
      setStatus({ state: "error", message: error.message });
    }
  }

  async function requestIntakeHelp() {
    setAssistant({ state: "loading", data: null, message: "Reviewing the intake..." });
    try {
      const data = await getIntakeAssist({ form, selectedClauses: selectedClauses.map((clause) => clause.name) });
      setAssistant({ state: "success", data, message: "" });
    } catch (error) {
      setAssistant({ state: "error", data: null, message: error.message });
    }
  }

  async function saveDraftForFollowUp() {
    setAssistant({ state: "loading", data: assistant.data, message: "Saving intake progress..." });
    try {
      const data = await saveIntakeDraft({
        email: form.email,
        fullName: form.fullName,
        state: form.state,
        form,
        selectedClauses: selectedClauses.map((clause) => clause.name)
      });
      setAssistant({ state: "success", data: assistant.data, message: data.message });
    } catch (error) {
      setAssistant({ state: "error", data: assistant.data, message: error.message });
    }
  }

  async function loadOperationsBrief() {
    setOpsBrief({ state: "loading", data: opsBrief.data, message: "Loading command center..." });
    try {
      const data = await getOperationsBrief();
      setOpsBrief({ state: "success", data, message: "" });
    } catch (error) {
      setOpsBrief({ state: "error", data: null, message: error.message });
    }
  }

  async function createLeadBrief() {
    setLeadBrief({ state: "loading", data: leadBrief.data, message: "Building growth brief..." });
    try {
      const data = await getLeadBrief(growthInput);
      setLeadBrief({ state: "success", data, message: "" });
    } catch (error) {
      setLeadBrief({ state: "error", data: null, message: error.message });
    }
  }

  return (
    <main>
      <UPLBar />
      <section className="hero" style={{ backgroundImage: `url("${asset("/images/trust-hero.png")}")` }}>
        <div className="heroShade" />
        <nav className="nav">
          <div className="brand">
            <span className="brandMark">LT</span>
            <span>LivingTrust Counsel</span>
          </div>
          <div className="navLinks">
            <button onClick={() => setActiveTab("landing")}>Overview</button>
            <button onClick={() => setActiveTab("start")}>Intake</button>
            <button onClick={() => setActiveTab("clauses")}>Protections</button>
            <button onClick={() => setActiveTab("legal")}>Review</button>
            <button onClick={() => setActiveTab("resources")}>Resources</button>
            <button onClick={() => setActiveTab("command")}>Case Desk</button>
            <button onClick={() => setActiveTab("marketing")}>Marketing</button>
          </div>
        </nav>
        <div className="heroContent">
          <span className="eyebrow">Estate planning document preparation with attorney-ready files</span>
          <h1>Protect your family plan before probate decides for you.</h1>
          <p>Prepare a state-specific living trust package, organize your successor trustee instructions, and create a clean review file to discuss with a licensed attorney before signing.</p>
          <div className="heroActions">
            <button className="primary" onClick={() => setActiveTab("start")}>Start confidential intake</button>
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

      <section className="metrics">
        <Metric label="State rule library" value="50" />
        <Metric label="Estate documents" value="4" />
        <Metric label="Review-ready file" value="1 hr" />
        <Metric label="Annual plan reminders" value="1 yr" />
      </section>

      {returnNotice && (
        <section className="workspace">
          <div className="noticePanel">
            <strong>Submission received</strong>
            <p>{returnNotice}</p>
          </div>
        </section>
      )}

      {(activeTab === "landing" || activeTab === "start") && (
        <section className="workspace landingStack">
          <div className="attorneyIntro">
            <div>
              <span className="eyebrow dark">Professional estate-planning workflow</span>
              <h2>A private intake experience that feels like a law office, not a form mill.</h2>
              <p>Families need more than a template. They need a careful record of intent, capacity, trustees, beneficiaries, asset funding, digital property, and state-specific signing steps. This layout presents the product like a professional estate law intake desk while keeping the no-legal-advice boundary clear.</p>
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
            <img src={asset("/images/trust-education.png")} alt="Living trust planning materials" />
            <div>
              <span className="eyebrow dark">Living trust fundamentals</span>
              <h2>Estate planning starts with control, privacy, and continuity.</h2>
              <p>A revocable living trust is a legal arrangement where a grantor places assets under trust management during life and names who receives or controls those assets after death or incapacity. It is commonly used to avoid probate delays, keep private family instructions out of public court filings, organize successor trustee authority, and give financial institutions a clear path for administration.</p>
              <p>The trust only works for assets that are properly connected to it. That is why this app generates funding instructions for real estate, bank accounts, brokerage accounts, business interests, vehicles, and digital assets, alongside the trust document itself.</p>
            </div>
          </div>

          <div className="imageStoryGrid">
            <article>
              <img src={asset("/images/questionnaire.png")} alt="Guided estate planning intake" />
              <div>
                <span>01</span>
                <h3>Confidential intake</h3>
                <p>Collect trustee, beneficiary, family, asset, and distribution details in a structured estate-planning interview.</p>
              </div>
            </article>
            <article>
              <img src={asset("/images/delivery.png")} alt="Estate document delivery folder" />
              <div>
                <span>02</span>
                <h3>Review-ready document package</h3>
                <p>Prepare the trust, pour-over will, certificate, and funding instructions for attorney review before signing.</p>
              </div>
            </article>
          </div>

          <div className="processGrid">
            {[
              ["1", "Create the plan", "Answer state, family, trustee, beneficiary, distribution, clause, and asset questions. The backend renders a full document package from the completed JSON."],
              ["2", "Attorney-ready review file", "After payment, the package is organized for review by a licensed attorney in the customer's state before signing or relying on the documents."],
              ["3", "Sign correctly", "The grantor signs using the state-specific execution instructions shown in the package. Many trusts are signed before a notary, and some related estate documents require witnesses."],
              ["4", "Fund the trust", "Assets must be retitled, assigned, or beneficiary-designated into the trust where appropriate. An unfunded trust may not avoid probate for assets left outside it."],
              ["5", "Store and use it", "The certificate of trust can be shared with banks or institutions when they need proof of trustee authority without exposing private distribution terms."],
              ["6", "Review annually", "Life changes, tax law changes, moves to another state, new assets, births, deaths, divorce, or trustee changes can all trigger a trust update."]
            ].map(([step, title, body]) => (
              <article className="processCard" key={title}>
                <span>{step}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>

          <div className="courtReady">
            <div>
              <span className="eyebrow dark">Execution and enforceability</span>
              <h2>Built for legal review, proper signing, and strong records.</h2>
              <p>No app can guarantee that a document will stand up in court in every dispute. This product is designed to improve review quality by using complete facts, state-specific execution instructions, attorney-ready files, audit records, versioned documents, payment records, and clear signing/funding guidance.</p>
            </div>
            <ul>
              <li>Confirm identity, capacity, grantor intent, and absence of coercion before signing.</li>
              <li>Use the state execution checklist for notary and witness requirements.</li>
              <li>Keep signed originals, attorney notes, and funding confirmations together.</li>
              <li>Update the trust after major life, asset, tax, family, or residence changes.</li>
            </ul>
          </div>
        </section>
      )}

      {activeTab === "start" && (
        <section className="workspace">
          <div className="introPanel">
            <div>
              <span className="eyebrow dark">Attorney-style intake</span>
              <h2>Gather the facts a reviewer needs before a document is trusted.</h2>
              <p>The intake captures the estate planning facts that matter: grantor identity, state, successor trustees, beneficiaries, distribution intent, asset inventory, digital property, and clause selections. The completed record is then sent to the drafting pipeline for review-ready document generation.</p>
            </div>
            <img src={asset("/images/questionnaire.png")} alt="Estate planning questionnaire workspace" />
          </div>

          <div className="agentPanel">
            <div>
              <span className="eyebrow dark">Review preparation assistant</span>
              <h2>Surface missing facts before attorney review.</h2>
              <p>The assistant checks missing information, flags review risks, and tells the customer the next best step in plain English while preserving the no-legal-advice boundary.</p>
            </div>
            <div className="agentActions">
              <button className="primary" type="button" onClick={requestIntakeHelp} disabled={assistant.state === "loading"}>
                {assistant.state === "loading" ? "Reviewing..." : "Review this intake"}
              </button>
              <button className="quietButton" type="button" onClick={saveDraftForFollowUp} disabled={assistant.state === "loading"}>
                Save for follow-up
              </button>
            </div>
            {assistant.data && (
              <div className="assistantResult">
                <strong>{assistant.data.completionScore}% complete</strong>
                <p>{assistant.data.assistantMessage}</p>
                <div className="miniGrid">
                  <MiniList title="Missing facts" items={assistant.data.missingFields} empty="No major missing facts." />
                  <MiniList title="Review flags" items={assistant.data.riskFlags} empty="No extra flags yet." />
                </div>
                <p className="nextAction">Next: {assistant.data.nextBestAction}</p>
              </div>
            )}
            {assistant.message && <p className={`status ${assistant.state}`}>{assistant.message}</p>}
          </div>

          <form className="formShell" onSubmit={submitPackage}>
            <div className="pricingSelector">
              {PRODUCT_TIERS.map((tier) => (
                <button
                  type="button"
                  className={`priceCard ${selectedTier === tier.id ? "selected" : ""}`}
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  <span>{tier.name}</span>
                  <strong>{tier.price}</strong>
                  <em>{tier.note}</em>
                  <p>{tier.description}</p>
                </button>
              ))}
            </div>
            <div className="formGrid">
              <label>Grantor full name<input required name="fullName" value={form.fullName} onChange={updateField} placeholder="Alex Morgan" /></label>
              <label>Email for delivery<input required type="email" name="email" value={form.email} onChange={updateField} placeholder="alex@example.com" /></label>
              <label>State<select name="state" value={form.state} onChange={updateField}>{STATES.map((state) => <option key={state}>{state}</option>)}</select></label>
              <label>Address<input name="address" value={form.address} onChange={updateField} placeholder="Street, city, ZIP" /></label>
              <label>Trust type<input name="trustType" value={form.trustType} onChange={updateField} /></label>
              <label>Successor trustee<input name="successorTrustee" value={form.successorTrustee} onChange={updateField} placeholder="Name and relationship" /></label>
              <label className="wide">Beneficiaries<textarea name="beneficiaries" value={form.beneficiaries} onChange={updateField} placeholder="Names, relationships, ages, special circumstances" /></label>
              <label className="wide">Distribution plan<textarea name="distributionPlan" value={form.distributionPlan} onChange={updateField} placeholder="Equal shares, staggered ages, HEMS limits, special instructions" /></label>
              <label className="wide">Asset inventory summary<textarea name="assetSummary" value={form.assetSummary} onChange={updateField} placeholder="High-level overview of the estate, major assets, and anything that needs attorney attention" /></label>
            </div>
            <div className="assetIntake">
              <div className="assetHeader">
                <span className="eyebrow dark">Often-forgotten assets</span>
                <h3>Inventory the things families and quick forms often miss.</h3>
                <p>These questions help the reviewer catch funding gaps, beneficiary conflicts, title issues, regulated property, and assets that may need separate transfer steps.</p>
              </div>
              <div className="assetGrid">
                {ASSET_INTAKE_FIELDS.map(([key, label, placeholder]) => (
                  <label key={key}>
                    {label}
                    <textarea name={key} value={form[key]} onChange={updateField} placeholder={placeholder} />
                  </label>
                ))}
                <label className="wide">Beneficiary-designation check<textarea name="beneficiaryDesignations" value={form.beneficiaryDesignations} onChange={updateField} placeholder="Life insurance, retirement accounts, transfer-on-death/payable-on-death accounts, brokerage beneficiaries, mismatches to fix" /></label>
                <label className="wide">Assets to exclude or handle separately<textarea name="excludedAssets" value={form.excludedAssets} onChange={updateField} placeholder="Joint property, retirement accounts, out-of-state property, business interests, restricted assets, or items the trust should not receive directly" /></label>
                <label className="wide">Family, fiduciary, or asset instructions reviewers should not miss<textarea name="specialInstructions" value={form.specialInstructions} onChange={updateField} placeholder="Blended family concerns, disinheritance, guardianship concerns, special needs, creditor issues, firearm transfer wishes, sentimental gifts, trustee conflicts" /></label>
              </div>
            </div>
            <div className="deliveryPanel">
              <img src={asset("/images/delivery.png")} alt="Secure document delivery package" />
              <div>
                <h3>Attorney-review delivery path</h3>
                <p>Stripe checkout is configured for $397 base prep, $997 family prep, and $149 annual maintenance. Until attorney partners are active, delivery is document preparation with clear instructions to consult a licensed attorney before signing or relying on any document.</p>
                <button className="primary" disabled={status.state === "loading"}>{status.state === "loading" ? "Working..." : PRODUCT_TIERS.find((tier) => tier.id === selectedTier)?.cta}</button>
                {status.message && <p className={`status ${status.state}`}>{status.message}</p>}
              </div>
            </div>
          </form>
        </section>
      )}

      {activeTab === "command" && (
        <section className="workspace commandCenter">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow dark">Agent command center</span>
              <h2>Daily operating view for the trust business.</h2>
              <p>Modeled from the transcript playbook: keep a researcher, operator, reviewer, and growth assistant running against one business outcome.</p>
            </div>
            <button className="primary" onClick={loadOperationsBrief} disabled={opsBrief.state === "loading"}>
              {opsBrief.state === "loading" ? "Loading..." : "Refresh brief"}
            </button>
          </div>

          {opsBrief.data ? (
            <>
              <div className="opsScorecard">
                <Metric label="Total trusts" value={opsBrief.data.scorecard.totalTrusts} />
                <Metric label="Awaiting payment" value={opsBrief.data.scorecard.awaitingPayment} />
                <Metric label="Attorney review" value={opsBrief.data.scorecard.attorneyReview} />
                <Metric label="Drafts 7 days" value={opsBrief.data.scorecard.abandonedDrafts7d} />
              </div>
              <div className="commandGrid">
                <article className="commandCard">
                  <h3>Review queue</h3>
                  {opsBrief.data.queue.length ? opsBrief.data.queue.map((item) => (
                    <p key={item.id}><strong>{item.grantor_name}</strong> - {item.state} - {item.status}</p>
                  )) : <p>No active review items.</p>}
                </article>
                <article className="commandCard">
                  <h3>Next actions</h3>
                  <MiniList items={opsBrief.data.nextActions} empty="No actions." />
                </article>
              </div>
            </>
          ) : (
            <div className="emptyState">
              <h3>Run the first daily brief.</h3>
              <p>This will summarize payment, attorney-review, delivery, and abandoned-intake work from the backend.</p>
            </div>
          )}
          {opsBrief.message && <p className={`status ${opsBrief.state}`}>{opsBrief.message}</p>}

          <div className="protocolGrid">
            {[
              ["Researcher", "Monitors market, competitor changes, state landing-page ideas, and partner opportunities."],
              ["Intake operator", "Finds abandoned drafts, drafts follow-ups, and identifies missing customer facts."],
              ["Review coordinator", "Prepares attorney packets, checks 24-hour review queue, and watches approval bottlenecks."],
              ["Growth assistant", "Creates daily outreach ideas, lead magnets, advisor scripts, and experiment notes."]
            ].map(([title, body]) => (
              <article className="protocolCard" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "clauses" && (
        <section className="workspace">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow dark">Clause engine</span>
              <h2>{selected.length} clauses selected, including {criticalCount} critical safeguards.</h2>
            </div>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          <div className="clauseList">
            {filtered.map((clause) => (
              <article className="clause" key={clause.id}>
                <header onClick={() => setExpanded(expanded === clause.id ? "" : clause.id)}>
                  <input type="checkbox" checked={selected.includes(clause.id)} onChange={() => toggleClause(clause.id)} onClick={(event) => event.stopPropagation()} />
                  <div>
                    <h3>{clause.name}</h3>
                    <p>{clause.description}</p>
                  </div>
                  <span className={riskClass[clause.risk]}>{clause.risk}</span>
                </header>
                {expanded === clause.id && (
                  <div className="questions">
                    {clause.questionnaire.map((question) => <p key={question}>{question}</p>)}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "legal" && (
        <section className="workspace legalGrid">
          {["UPL disclaimer on every page", "RUFADAA digital assets language", "All 50 state rule placeholders", "Attorney-ready review packet", "PostgreSQL document retrieval", "Annual review reminder cron"].map((item) => (
            <article className="legalCard" key={item}>
              <h3>{item}</h3>
              <p>Implemented as a production integration boundary with provider credentials supplied by environment variables and conservative local development fallbacks.</p>
            </article>
          ))}
        </section>
      )}

      {activeTab === "resources" && (
        <section className="workspace resourceStack">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow dark">State trust resources</span>
              <h2>Use state guides and verified attorney directories before signing.</h2>
              <p>These links help customers research state law and find licensed estate-planning attorneys. Directory and search links are not endorsements, rankings, or legal advice.</p>
            </div>
          </div>
          <div className="resourceNotice">
            <strong>Attorney link policy</strong>
            <p>LivingTrust does not claim these are the top attorneys in any state. The resource page links to public legal directories, bar referral resources, and Google searches so customers can compare licensed counsel directly.</p>
          </div>
          <div className="resourceGrid">
            {STATE_RESOURCES.map((state) => (
              <article className="resourceCard" key={state.code}>
                <header>
                  <span>{state.code}</span>
                  <h3>{state.name}</h3>
                </header>
                <div className="resourceLinks">
                  <a href={state.guide} target="_blank" rel="noreferrer">State law guide</a>
                  <a href={state.findLaw} target="_blank" rel="noreferrer">FindLaw estate attorneys</a>
                  <a href={state.justia} target="_blank" rel="noreferrer">Justia estate attorneys</a>
                  <a href={state.superLawyers} target="_blank" rel="noreferrer">Super Lawyers directory</a>
                  <a href={state.avvo} target="_blank" rel="noreferrer">Avvo estate attorneys</a>
                  <a href={state.google} target="_blank" rel="noreferrer">Google attorney search</a>
                  <a href={state.aba} target="_blank" rel="noreferrer">ABA referral directory</a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "marketing" && (
        <section className="workspace marketingPlan">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow dark">Go-to-market plan</span>
              <h2>Market the app as careful estate document preparation, not a law firm.</h2>
            </div>
          </div>
          <article className="growthBriefCard">
            <div>
              <h3>Lead finder brief</h3>
              <p>Create a daily research plan using the transcript pattern: public signal, neglected need, clear buyer, and simple monetization path.</p>
            </div>
            <div className="growthInputs">
              <label>Market<input value={growthInput.market} onChange={(event) => setGrowthInput((current) => ({ ...current, market: event.target.value }))} /></label>
              <label>Audience<input value={growthInput.audience} onChange={(event) => setGrowthInput((current) => ({ ...current, audience: event.target.value }))} /></label>
              <button className="primary" onClick={createLeadBrief} disabled={leadBrief.state === "loading"}>
                {leadBrief.state === "loading" ? "Building..." : "Build lead brief"}
              </button>
            </div>
            {leadBrief.data && (
              <div className="leadBriefResult">
                <MiniList title="Best channels" items={leadBrief.data.bestChannels} />
                <MiniList title="Lead signals" items={leadBrief.data.leadSignals} />
                <MiniList title="Experiments" items={leadBrief.data.experiments} />
                <MiniList title="Daily protocol" items={leadBrief.data.dailyProtocol} />
              </div>
            )}
            {leadBrief.message && <p className={`status ${leadBrief.state}`}>{leadBrief.message}</p>}
          </article>
          {[
            ["Positioning", "Lead with privacy, probate avoidance, family readiness, attorney-ready files, and state-specific execution guidance. Avoid promising legal outcomes; promise a guided document-preparation package."],
            ["Audience", "Primary buyers: homeowners age 35-70, parents with minor children, blended families, digital-asset owners, business owners, and people who have recently moved states. Secondary buyers: financial advisors and CPAs who want a referral-ready client workflow."],
            ["Offer", "One-time package at $397 as the default price, $997 for family preparation, and $149 per year for annual maintenance. Add attorney review only after state-licensed partners are contracted."],
            ["Channels", "SEO pages by state and life event, paid search for high-intent probate/trust keywords, advisor referral partnerships, webinars with attorneys, lifecycle email campaigns, and retargeting for abandoned questionnaire users."],
            ["Content", "Publish plain-language guides: living trust vs will, how to fund a trust, state signing rules, digital assets and RUFADAA, trust updates after divorce or moving, and trustee responsibilities."],
            ["Conversion Funnel", "Hero page to trust education, free readiness checklist, guided questionnaire, document preview, Stripe checkout, review-ready delivery email, then annual review reminder."],
            ["Trust Signals", "Show security posture, privacy commitments, no-legal-advice disclaimer, refund policy, sample certificate of trust, state resources, and a transparent attorney-review boundary."],
            ["Metrics", "Track visitor-to-start rate, questionnaire completion, checkout conversion, review packet completion time, delivery success, refund rate, cost per completed trust, referral partner activation, and annual review re-engagement."]
          ].map(([title, body]) => (
            <article className="marketingCard" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </section>
      )}

      <footer>
        LivingTrust Pro prepares documents from your input. It does not provide legal advice. Consult a licensed attorney in your state before signing or relying on any estate planning document.
      </footer>
    </main>
  );
}

function Metric({ label, value }) {
  return <div><strong>{value}</strong><span>{label}</span></div>;
}

function MiniList({ title, items = [], empty = "Nothing to show yet." }) {
  return (
    <div className="miniList">
      {title && <h4>{title}</h4>}
      {items.length ? (
        <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
      ) : (
        <p>{empty}</p>
      )}
    </div>
  );
}

function UPLBar() {
  return (
    <div className="upl">
      Document preparation software only. No legal advice is provided. Consult a licensed attorney in your state before signing or relying on any estate planning document.
    </div>
  );
}
