import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Shield,
  Cookie,
  Scale,
  AlertOctagon,
  X,
  Copy,
  Check,
  Printer,
  Building2,
  Car,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export type PolicyTab = 'terms' | 'privacy' | 'cookies' | 'compliance' | 'prohibited';

interface LegalPoliciesModalProps {
  isOpen: boolean;
  initialTab?: PolicyTab;
  onClose: () => void;
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);
  const [copied, setCopied] = useState(false);

  // Sync initial tab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const handleCopy = () => {
    let textToCopy = '';
    if (activeTab === 'terms') {
      textToCopy =
        'HUTA.LK TERMS & CONDITIONS\nGoverned under the Laws of the Democratic Socialist Republic of Sri Lanka\nIncorporating the Electronic Transactions Act No. 19 of 2006.\nFull legal documentation available at https://huta.lk';
    } else if (activeTab === 'privacy') {
      textToCopy =
        'HUTA.LK PRIVACY POLICY\nFully compliant with Sri Lanka Personal Data Protection Act (PDPA) No. 9 of 2022.\nFull legal documentation available at https://huta.lk';
    } else if (activeTab === 'cookies') {
      textToCopy =
        'HUTA.LK COOKIE & LOCAL STORAGE POLICY\nTransparent essential browser storage for shopping cart and theme preferences.\nFull documentation available at https://huta.lk';
    } else if (activeTab === 'compliance') {
      textToCopy =
        'HUTA.LK SRI LANKAN STATUTORY COMPLIANCE & LEGAL ACTS\nCovering CAA Act No. 9 of 2003, Computer Crimes Act No. 24 of 2007, Motor Traffic Act, and Prevention of Frauds Ordinance.\nFull documentation available at https://huta.lk';
    } else {
      textToCopy =
        'HUTA.LK PROHIBITED GOODS & MARKETPLACE SAFETY POLICY\nEnforcing strict statutory bans under Sri Lankan Law.\nFull documentation available at https://huta.lk';
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
        <div className="absolute inset-0" onClick={onClose} aria-label="Close modal overlay" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white dark:bg-[#151822] rounded-3xl max-w-4xl w-full border border-gray-200 dark:border-[#252836] shadow-2xl overflow-hidden my-6 z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 text-white flex items-center justify-between shrink-0 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#FF5A36] shadow-inner">
                {activeTab === 'terms' && <FileText className="w-5 h-5 text-[#FF5A36]" />}
                {activeTab === 'privacy' && <Shield className="w-5 h-5 text-emerald-400" />}
                {activeTab === 'cookies' && <Cookie className="w-5 h-5 text-amber-400" />}
                {activeTab === 'compliance' && <Scale className="w-5 h-5 text-blue-400" />}
                {activeTab === 'prohibited' && <AlertOctagon className="w-5 h-5 text-rose-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full text-gray-300">
                    Sri Lankan Legal Framework
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                    PDPA & ETA Compliant
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight mt-0.5">
                  {activeTab === 'terms' && 'Terms & Conditions (Sri Lanka Marketplace)'}
                  {activeTab === 'privacy' && 'Privacy Policy (PDPA Act No. 9 of 2022)'}
                  {activeTab === 'cookies' && 'Cookie & Local Storage Policy'}
                  {activeTab === 'compliance' && 'Statutory Acts, Consumer Rights & Legal Disclaimers'}
                  {activeTab === 'prohibited' && 'Prohibited Items & Safety Enforcement'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                title="Copy policy citation"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline text-[11px]">{copied ? 'Copied' : 'Cite'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer text-xs hidden sm:flex items-center gap-1"
                title="Print document"
              >
                <Printer className="w-4 h-4" />
                <span className="text-[11px]">Print</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer ml-1"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Selector Navigation */}
          <div className="flex items-center gap-1.5 p-2 px-4 bg-gray-50 dark:bg-[#1A1D2B] border-b border-gray-200 dark:border-[#252836] shrink-0 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-white dark:bg-[#151822] text-[#FF5A36] shadow-xs border border-gray-200 dark:border-white/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms & Conditions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-white dark:bg-[#151822] text-emerald-600 dark:text-emerald-400 shadow-xs border border-gray-200 dark:border-white/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Privacy Policy (PDPA)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cookies')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'cookies'
                  ? 'bg-white dark:bg-[#151822] text-amber-600 dark:text-amber-400 shadow-xs border border-gray-200 dark:border-white/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Cookie className="w-3.5 h-3.5" />
              <span>Cookie Policy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('compliance')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'compliance'
                  ? 'bg-white dark:bg-[#151822] text-blue-600 dark:text-blue-400 shadow-xs border border-gray-200 dark:border-white/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Sri Lankan Acts & Disclaimers</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prohibited')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'prohibited'
                  ? 'bg-white dark:bg-[#151822] text-rose-600 dark:text-rose-400 shadow-xs border border-gray-200 dark:border-white/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Prohibited Items & Safety</span>
            </button>
          </div>

          {/* Modal Body Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 text-xs text-gray-700 dark:text-gray-300 leading-relaxed space-y-6">
            {/* ------------------------------------------------------------- */}
            {/* 1. TERMS & CONDITIONS                                         */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'terms' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-orange-50/80 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-800/40 text-[11px] text-orange-950 dark:text-orange-200 flex items-start gap-3">
                  <Scale className="w-4 h-4 text-[#FF5A36] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs mb-0.5">
                      Statutory Enforceability under Sri Lankan Law
                    </p>
                    <p>
                      These Terms & Conditions constitute a legally binding electronic contract entered into in accordance with the <strong>Electronic Transactions Act No. 19 of 2006 (as amended by Act No. 25 of 2017)</strong> of the Democratic Socialist Republic of Sri Lanka.
                    </p>
                  </div>
                </div>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span>1. Acceptance of Terms & Digital Consent</span>
                  </h4>
                  <p>
                    By accessing, browsing, registering an account, publishing advertisements, submitting merchant listings, or communicating with buyers/sellers on <strong>HUTA.LK</strong> (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you confirm that you have read, understood, and agreed to be bound by these Terms & Conditions. If you do not accept these terms, you must discontinue using the Platform immediately.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    2. Legal Role of HUTA.LK: Classifieds Intermediary Safe Harbor
                  </h4>
                  <p>
                    HUTA.LK operates strictly as an <strong>online intermediary marketplace and communications host</strong> within the meaning of the Electronic Transactions Act. Unless an advertisement is expressly verified under our verified merchant program:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-400">
                    <li>HUTA.LK is not an auctioneer, retailer, broker, transport provider, or legal escrow agent.</li>
                    <li>HUTA.LK does not hold physical custody of, inspect the roadworthiness of, or guarantee legal title to vehicles, lands, electronics, or personal property listed by peer-to-peer sellers.</li>
                    <li>All contracts of sale, prices, vehicle condition representations, and physical exchanges are entered into directly between the independent buyer and seller.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    3. Seller Responsibilities & Ad Accuracy
                  </h4>
                  <p>Every person posting an advertisement on HUTA.LK warrants and represents that:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-400">
                    <li>They are at least 18 years of age or possess legal parental/guardian capacity under the laws of Sri Lanka.</li>
                    <li>They hold unencumbered legal title or authentic authorization from the legal owner to sell, lease, or advertise the item or service.</li>
                    <li>All prices must be quoted transparently in <strong>Sri Lankan Rupees (LKR)</strong> including any applicable statutory levies, without hidden extra fees.</li>
                    <li>Photographs uploaded must depict the authentic, actual item being offered and must not infringe third-party copyrights or trademarks under the <strong>Intellectual Property Act No. 36 of 2003</strong>.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    4. E-Store Merchants & Commercial Retailers
                  </h4>
                  <p>
                    Commercial businesses operating dedicated E-Stores on HUTA.LK must comply with the <strong>Consumer Affairs Authority Act No. 9 of 2003</strong>. Merchants must:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-400">
                    <li>Disclose legitimate business registration details upon request by platform administrators or regulatory authorities.</li>
                    <li>Honor published return, warranty, and replacement policies for defective or damaged goods.</li>
                    <li>Provide genuine Cash on Delivery (COD) dispatch tracking via recognized Sri Lankan domestic couriers (e.g. Prompt, Koombiyo, Domex, Certis Lanka).</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    5. Content Moderation & Takedown Rights
                  </h4>
                  <p>
                    HUTA.LK reserves the absolute statutory right to decline, edit, unpublish, or permanently delete any listing, story, review, or customer account that violates Sri Lankan law, contains fraudulent claims, breaches consumer safety standards, or receives verifiable abuse reports, without prior compensation.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    6. Limitation of Liability & Indemnity
                  </h4>
                  <p>
                    To the maximum extent permitted under the laws of Sri Lanka, HUTA.LK, its founders, and technical operators shall not be liable for any direct, indirect, incidental, punitive, or consequential loss resulting from:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Default, breach of contract, misrepresentation, or fraud committed by any buyer, seller, or courier.</li>
                    <li>Undetected mechanical or legal defects in vehicles, properties, or electronic devices transacted between users.</li>
                    <li>Temporary website outages, scheduled server maintenance, or telecommunications disruptions beyond our reasonable control.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    7. Governing Law & Exclusive Jurisdiction
                  </h4>
                  <p>
                    These Terms & Conditions, and any dispute, controversy, or claim arising out of or in connection with the Platform, shall be governed by and construed in accordance with the substantive <strong>laws of the Democratic Socialist Republic of Sri Lanka</strong>. The parties submit to the <strong>exclusive jurisdiction of the competent Courts situated in Colombo, Western Province, Sri Lanka</strong>.
                  </p>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 2. PRIVACY POLICY (PDPA ACT NO. 9 OF 2022)                    */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'privacy' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-[11px] text-emerald-950 dark:text-emerald-200 flex items-start gap-3">
                  <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs mb-0.5">
                      Personal Data Protection Act (PDPA) No. 9 of 2022 Compliance
                    </p>
                    <p>
                      HUTA.LK processes personal data in strict compliance with the statutory principles of data minimization, lawful processing, and accountability established under Sri Lanka&apos;s PDPA No. 9 of 2022.
                    </p>
                  </div>
                </div>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    1. Data Controller Identity & Designated Officer
                  </h4>
                  <p>
                    The Data Controller responsible for personal information processed on this website is <strong>HUTA.LK</strong>. You may contact our Data Protection Liaison at <strong>privacy@huta.lk</strong> or via postal dispatch to our Colombo administrative office.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    2. Personal Data We Collect
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/70 dark:border-[#252836]">
                      <strong className="block text-gray-900 dark:text-white mb-1">Customer & Seller Data:</strong>
                      <p className="text-gray-600 dark:text-gray-400">
                        Full Name, Sri Lankan mobile phone number (+94), chosen username, hashed credentials, and optional email address provided during registration or ad submission.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/70 dark:border-[#252836]">
                      <strong className="block text-gray-900 dark:text-white mb-1">Advertisement & Media Content:</strong>
                      <p className="text-gray-600 dark:text-gray-400">
                        Item photos, video reels, descriptions, price in LKR, geographic district/city, and seller contact telephone numbers designated for publication.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/70 dark:border-[#252836]">
                      <strong className="block text-gray-900 dark:text-white mb-1">Technical & Security Telemetry:</strong>
                      <p className="text-gray-600 dark:text-gray-400">
                        Device type, browser fingerprint, approximate IP geolocation, session timestamps, and OTP delivery logs utilized solely for fraud prevention.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/70 dark:border-[#252836]">
                      <strong className="block text-gray-900 dark:text-white mb-1">E-Store Transaction Data:</strong>
                      <p className="text-gray-600 dark:text-gray-400">
                        Cart order summaries, delivery district selection, and courier dispatch addresses communicated directly to merchants via WhatsApp checkout.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    3. Lawful Bases for Processing (PDPA Part I)
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                    <li><strong>Contractual Necessity:</strong> To publish, index, and broadcast your advertisements to prospective buyers across Sri Lanka.</li>
                    <li><strong>Explicit Consent:</strong> Granted upon registering or entering your mobile phone number for OTP verification.</li>
                    <li><strong>Legal & Regulatory Obligation:</strong> Compliance with anti-fraud reporting and requests by Sri Lanka Police under the Computer Crimes Act.</li>
                    <li><strong>Legitimate Interest:</strong> Safeguarding platform integrity against automated scrapers, spammers, and illegal listings.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    4. Data Subject Rights Under Sri Lankan Law
                  </h4>
                  <p>In accordance with Sections 13, 14, 15, and 16 of the PDPA No. 9 of 2022, every customer has:</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                    <li><strong>Right of Access & Confirmation (Sec 13):</strong> Request a copy of your personal data held by HUTA.LK.</li>
                    <li><strong>Right to Rectification (Sec 14):</strong> Modify or update your personal details, telephone, and listings directly via your User Dashboard.</li>
                    <li><strong>Right to Erasure / Account Deletion (Sec 15):</strong> Delete your advertisements, phone numbers, and profile.</li>
                    <li><strong>Right to Withdraw Consent (Sec 16):</strong> Revoke consent for communications or marketing at any time.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    5. Data Security, Cloud Storage & Non-Sale of Data
                  </h4>
                  <p>
                    We <strong>never sell, lease, or monetize customer telephone numbers or identities to third-party telemarketers</strong>. Data is stored on enterprise Google Cloud Firebase Firestore infrastructure employing AES-256 encryption at rest and TLS 1.3 encryption in transit.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    6. Escalation to the Data Protection Authority (DPA)
                  </h4>
                  <p>
                    If you believe your personal data has been handled inconsistently with the Personal Data Protection Act No. 9 of 2022, you are entitled under Sri Lankan law to lodge a complaint with the <strong>Data Protection Authority of Sri Lanka</strong>.
                  </p>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 3. COOKIE POLICY                                              */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'cookies' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-[11px] text-amber-950 dark:text-amber-200 flex items-start gap-3">
                  <Cookie className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs mb-0.5">
                      Zero Third-Party Ad Trackers Policy
                    </p>
                    <p>
                      HUTA.LK utilizes only strictly functional cookies and HTML5 LocalStorage essential to operate the marketplace, shopping cart, and security sessions. We do not sell tracking cookies to external behavioral ad networks.
                    </p>
                  </div>
                </div>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    1. What Storage Technologies We Use
                  </h4>
                  <p>
                    Modern web applications use lightweight browser storage to ensure smooth loading and persist user preferences between visits without requiring repeated logins.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    2. Transparent Storage Registry
                  </h4>
                  <div className="border border-gray-200 dark:border-[#252836] rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-100 dark:bg-[#1A1D2B] text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-[#252836]">
                        <tr>
                          <th className="p-3">Storage Key</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Statutory Purpose</th>
                          <th className="p-3">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-[#252836]">
                        <tr>
                          <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">huta_user</td>
                          <td className="p-3 text-emerald-600 font-bold">Authentication</td>
                          <td className="p-3">Keeps your private customer session active so only you can edit your ads.</td>
                          <td className="p-3">Until Logout</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">huta_smart_cart</td>
                          <td className="p-3 text-blue-600 font-bold">Functionality</td>
                          <td className="p-3">Preserves items added to your WhatsApp E-Store shopping cart.</td>
                          <td className="p-3">Persistent</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">huta_theme</td>
                          <td className="p-3 text-purple-600 font-bold">Preference</td>
                          <td className="p-3">Remembers your display choice between Light Mode and Dark Mode.</td>
                          <td className="p-3">Persistent</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">huta_selected_location</td>
                          <td className="p-3 text-amber-600 font-bold">Localization</td>
                          <td className="p-3">Filters advertisements to your chosen Sri Lankan district (e.g. Colombo, Kandy, Galle).</td>
                          <td className="p-3">Persistent</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">huta_compare_ids</td>
                          <td className="p-3 text-gray-600 font-bold">Utility</td>
                          <td className="p-3">Allows side-by-side vehicle or property comparisons.</td>
                          <td className="p-3">Session</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    3. Managing Your Browser Storage
                  </h4>
                  <p>
                    You have total control. You can clear cookies, cache, and LocalStorage at any time via your browser settings (Chrome, Safari, Firefox, Edge). Please note that clearing storage will log you out and reset your shopping cart and dark mode preference.
                  </p>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 4. STATUTORY COMPLIANCE & LEGAL ACTS                          */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'compliance' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 text-[11px] text-blue-950 dark:text-blue-200 flex items-start gap-3">
                  <Scale className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs mb-0.5">
                      Overview of Applicable Sri Lankan Legislation
                    </p>
                    <p>
                      HUTA.LK operates under the legal framework of Sri Lanka. Below is a comprehensive summary of key statutes governing our marketplace, buyer protection, cybersecurity, and property transfers.
                    </p>
                  </div>
                </div>

                {/* 1. Consumer Affairs Authority */}
                <section className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/70 dark:border-[#252836] space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#FF5A36]" />
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                      1. Consumer Affairs Authority (CAA) Act No. 9 of 2003
                    </h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    The CAA Act safeguards consumers against unfair trade practices and misleading representations:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                    <li><strong>Prohibition of False Representation (Section 30):</strong> Sellers must not provide false statements regarding the standard, quality, grade, composition, or origin of goods.</li>
                    <li><strong>Transparent Pricing (Section 31):</strong> Prices must be displayed clearly in Sri Lankan Rupees. Deceptive strike-through pricing or artificial markups are strictly prohibited.</li>
                    <li><strong>Merchant Warranty Obligations:</strong> E-Store merchants providing electronics or consumer goods must specify the scope, duration, and conditions of any manufacturer or merchant warranty.</li>
                  </ul>
                </section>

                {/* 2. Computer Crimes Act */}
                <section className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/70 dark:border-[#252836] space-y-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                      2. Computer Crimes Act No. 24 of 2007
                    </h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    This statute criminalizes cyber offenses affecting digital infrastructure and user privacy:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                    <li><strong>Unauthorized Access & Tampering (Sections 3 & 4):</strong> Hacking, altering someone else&apos;s listings, scraping seller telephone numbers, or attempting brute-force logins is a criminal offense punishable by rigorous imprisonment and severe fines.</li>
                    <li><strong>Digital Identity Theft & Fraud:</strong> Impersonating another person, creating fake business listings to extract advance payments, or intercepting OTP SMS messages constitutes cyber fraud.</li>
                    <li><strong>Law Enforcement Cooperation:</strong> HUTA.LK collaborates fully with the <strong>Cyber Crime Investigation Division (CCID) of the Sri Lanka Police</strong> and <strong>Sri Lanka CERT|CC</strong>.</li>
                  </ul>
                </section>

                {/* 3. Motor Traffic Act */}
                <section className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/70 dark:border-[#252836] space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                      3. Motor Traffic Act (Chapter 203) — Vehicle Disclaimers
                    </h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Vehicle transactions in Sri Lanka are subject to strict statutory requirements:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                    <li><strong>Mandatory Transfer within 14 Days:</strong> Under the Motor Traffic Act, the registered owner and buyer must complete Form MTA 6 and Form MTA 8 to legally transfer vehicle title at the Department of Motor Traffic (DMT).</li>
                    <li><strong>Buyer Inspection Duty:</strong> Buyers are strongly advised to inspect the original Certificate of Registration (CR Book), valid revenue license, emission test certificate, and engine/chassis numbers before paying.</li>
                    <li><strong>No Warranty by Platform:</strong> HUTA.LK does not verify vehicle odometers or mechanical roadworthiness.</li>
                  </ul>
                </section>

                {/* 4. Prevention of Frauds Ordinance */}
                <section className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/70 dark:border-[#252836] space-y-2">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                      4. Prevention of Frauds Ordinance No. 7 of 1840 — Property & Real Estate
                    </h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    In Sri Lanka, contracts for the sale, purchase, or lease of immovable property (land, houses, apartments) <strong>must be in writing and attested by a licensed Notary Public and two witnesses</strong>.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Property advertisements on HUTA.LK are strictly informational invitations to treat and do not constitute an executed contract or conveyancing deed.</li>
                    <li>Buyers must engage an independent Attorney-at-Law / Notary Public to conduct an official title search (extract examination) at the relevant Land Registry before paying any advances.</li>
                  </ul>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 5. PROHIBITED ITEMS & SAFETY RULES                            */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'prohibited' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 text-[11px] text-rose-950 dark:text-rose-200 flex items-start gap-3">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs mb-0.5">
                      Zero Tolerance Policy for Unlawful Goods
                    </p>
                    <p>
                      To ensure consumer safety and strict compliance with Sri Lankan penal and regulatory codes, the following items are categorically prohibited on HUTA.LK. Violators will have their listings deleted, accounts banned, and may be reported to law enforcement.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    Categorically Prohibited Items Under Sri Lankan Law
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/70 dark:border-[#252836]">
                      <strong className="text-rose-600 dark:text-rose-400 block mb-1">
                        1. Pharmaceuticals & Unregistered Medicines
                      </strong>
                      <p className="text-gray-600 dark:text-gray-400">
                        Prescription medicines, narcotics, unapproved cosmetics, and medical apparatus banned under the <strong>National Medicines Regulatory Authority (NMRA) Act No. 5 of 2015</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/70 dark:border-[#252836]">
                      <strong className="text-rose-600 dark:text-rose-400 block mb-1">
                        2. Tobacco, Vapes & Alcohol
                      </strong>
                      <p className="text-gray-600 dark:text-gray-400">
                        Cigarettes, cigars, beedi, e-cigarettes, vapes, and alcoholic beverages. Advertising or sale online is strictly forbidden under the <strong>National Authority on Tobacco and Alcohol (NATA) Act No. 27 of 2006</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/70 dark:border-[#252836]">
                      <strong className="text-rose-600 dark:text-rose-400 block mb-1">
                        3. Protected Wildlife & Flora
                      </strong>
                      <p className="text-gray-600 dark:text-gray-400">
                        Wild animals, birds, endemic reptiles, ivory, turtle shells, and protected timber governed by the <strong>Fauna and Flora Protection Ordinance (FFPO)</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/70 dark:border-[#252836]">
                      <strong className="text-rose-600 dark:text-rose-400 block mb-1">
                        4. Weapons, Explosives & Military Surplus
                      </strong>
                      <p className="text-gray-600 dark:text-gray-400">
                        Firearms, ammunition, replica weapons, fireworks, flares, switchblades, and military uniform items under the Firearms Ordinance and Explosives Act.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/70 dark:border-[#252836]">
                      <strong className="text-rose-600 dark:text-rose-400 block mb-1">
                        5. Counterfeits & Pirated Copyrights
                      </strong>
                      <p className="text-gray-600 dark:text-gray-400">
                        Replica branded watches, counterfeit clothing, fake smartphones, and unauthorized pirated software infringing the <strong>Intellectual Property Act No. 36 of 2003</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/70 dark:border-[#252836]">
                      <strong className="text-rose-600 dark:text-rose-400 block mb-1">
                        6. Pyramid & Financial Schemes
                      </strong>
                      <p className="text-gray-600 dark:text-gray-400">
                        Multi-level marketing (MLM), pyramid schemes, unauthorized cryptocurrency solicitations, or &quot;get-rich-quick&quot; schemes banned by the <strong>Central Bank of Sri Lanka (CBSL)</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Safe Trading Protocol */}
                <section className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-2">
                  <h4 className="text-sm font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>HUTA Safe Marketplace Protocol for Sri Lankan Citizens</span>
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-emerald-900 dark:text-emerald-300">
                    <li><strong>Meet in Broad Daylight in Public Places:</strong> Preferred spots include bank lobbies, fuel stations, supermarkets, or crowded shopping centers.</li>
                    <li><strong>Never Send Advance Bank Transfers:</strong> Do not wire advance token fees or courier fees via eZ Cash, mCash, or bank accounts to unknown sellers before physically seeing the product.</li>
                    <li><strong>Inspect Before Payment:</strong> Test smartphones, laptops, and electronics thoroughly. Check IMEI numbers with the Telecommunications Regulatory Commission of Sri Lanka (TRCSL).</li>
                    <li><strong>Verify Vehicle Identity:</strong> Confirm vehicle chassis and engine numbers match the physical vehicle and the DMT Certificate of Registration (CR).</li>
                  </ul>
                </section>
              </div>
            )}
          </div>

          {/* Footer CTA & Legal Jurisdiction Notice */}
          <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-[#252836] bg-gray-50/90 dark:bg-[#181B26]/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-gray-500 dark:text-gray-400 text-center sm:text-left">
              <span>Jurisdiction: Democratic Socialist Republic of Sri Lanka</span>
              <span className="hidden sm:inline"> • Colombo Western Province</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-[#252836] hover:bg-gray-100 dark:hover:bg-[#202330] text-gray-700 dark:text-gray-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Copy</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-extrabold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
