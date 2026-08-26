import { useEffect, useMemo, useState } from "react";

import {
  getCurrentAccount,
  loginAccount,
  registerAccount,
  requestPasswordReset
} from "./api.js";
import { saveIntakeForm, saveTrustClauses } from "./trustData.js";

 
// -------------------------------
// Static data
// -------------------------------

const TRUST_CLAUSES = [
  {
    id: "spendthrift",
    name: "Spendthrift Clause",
    status: "requested",
    category: "Asset Protection",
    risk: "HIGH",
    description:
      "Protects beneficiary interests from creditors, lawsuits, transfers, and poor financial decisions before distribution.",
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
    description:
      "Gives the trustee controlled discretion over timing, amount, and purpose of distributions.",
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
    description:
      "Discourages beneficiaries from bringing unsupported challenges to the trust.",
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
    description:
      "Keeps inherited assets within the intended family line and defines treatment of spouses, stepchildren, and descendants.",
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
    description:
      "Defines how incapacity is determined and when successor trustee authority begins.",
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
    description:
      "Creates a court-free process for removing, replacing, and sequencing trustees.",
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
    description:
      "Names a neutral party who can adapt the trust to law changes, trustee problems, or drafting gaps.",
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
    description:
      "Protects means-tested benefits for beneficiaries with disabilities through supplemental-needs drafting.",
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
    description:
      "Provides money, instructions, and a caregiver for pets after death or incapacity.",
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
    description:
      "Adds RUFADAA authority for cryptocurrency, online accounts, digital files, NFTs, domains, and online businesses.",
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
    description:
      "Flags estate, gift, GST, and bypass-trust planning issues for attorney review.",
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
    description:
      "Defines the grantor's lifetime power to amend or revoke and the formal signing process.",
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
    description:
      "Creates a companion will that moves forgotten probate assets into the trust plan.",
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

 
const STATE_RESOURCES = [
  ["AL","Alabama","alabama"],["AK","Alaska","alaska"],["AZ","Arizona","arizona"],["AR","Arkansas","arkansas"],["CA","California","california"],
  ["CO","Colorado","colorado"],["CT","Connecticut","connecticut"],["DE","Delaware","delaware"],["FL","Florida","florida"],["GA","Georgia","georgia"],
  ["HI","Hawaii","hawaii"],["ID","Idaho","idaho"],["IL","Illinois","illinois"],["IN","Indiana","indiana"],["IA","Iowa","iowa"],
  ["KS","Kansas","kansas"],["KY","Kentucky","kentucky"],["LA","Louisiana","louisiana"],["ME","Maine","maine"],["MD","Maryland","maryland"],
  ["MA","Massachusetts","massachusetts"],["MI","Michigan","michigan"],["MN","Minnesota","minnesota"],["MS","Mississippi","mississippi"],["MO","Missouri","missouri"],
  ["MT","Montana","montana"],["NE","Nebraska","nebraska"],["NV","Nevada","nevada"],["NH","New Hampshire","new-hampshire"],["NJ","New Jersey","new-jersey"],
  ["NM","New Mexico","new-mexico"],["NY","New York","new-york"],["NC","North Carolina","north-carolina"],["ND","North Dakota","north-dakota"],["OH","Ohio","ohio"],
  ["OK","Oklahoma","oklahoma"],["OR","Oregon","oregon"],["PA","Pennsylvania","pennsylvania"],["RI","Rhode Island","rhode-island"],["SC","South Carolina","south-carolina"],
  ["SD","South Dakota","south-dakota"],["TN","Tennessee","tennessee"],["TX","Texas","texas"],["UT","Utah","utah"],["VT","Vermont","vermont"],
  ["VA","Virginia","virginia"],["WA","Washington","washington"],["WV","West Virginia","west-virginia"],["WI","Wisconsin","wisconsin"],["WY","Wyoming","wyoming"]
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

 
// -------------------------------
// Component
// -------------------------------

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

 
  function buildAssetSchedule() {
    return ASSET_INTAKE_FIELDS
      .map(([key, label]) => ({ type: label, description: (form[key] || "").trim() }))
      .filter((asset) => asset.description);
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

 
  async function startMaintenanceCheckout() {
    setStatus({
      state: "error",
      message: "Maintenance checkout is not enabled yet. Connect Stripe via a backend or Edge Function."
    });
  }

 
  async function requestIntakeHelp() {
    setAssistant({
      state: "error",
      data: null,
      message: "Intake assistant is not enabled yet. Wire to a backend or Edge Function."
    });
  }

 
  async function saveDraftForFollowUp() {
    setAssistant({
      state: "error",
      data: assistant.data,
      message: "Draft-saving is not enabled yet. Wire to a backend or Edge Function."
    });
  }

 
  async function loadOperationsBrief() {
    setOpsBrief({
      state: "error",
      data: null,
      message: "Operations brief is not enabled yet. Wire to a backend or Edge Function."
    });
  }

 
  async function createLeadBrief() {
    setLeadBrief({
      state: "error",
      data: null,
      message: "Lead brief is not enabled yet. Wire to a backend or Edge Function."
    });
  }

 
  return (
    <main>
      <section className="hero" style={{ backgroundImage: `url("${asset("/images/trust-hero.png")}")` }}>
        <div className="heroShade" />

        <nav className="nav">
          <div className="brand">
            <span className="brandMark">LT</span>
            <span>LivingTrust Counsel</span>