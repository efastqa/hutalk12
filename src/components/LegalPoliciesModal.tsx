import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Shield,
  Cookie,
  X,
  Copy,
  Check,
  Printer,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export type PolicyTab = 'terms' | 'privacy' | 'cookies';

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
      textToCopy = 'HUTA.LK TERMS & CONDITIONS (DRAFT)\n\n1. Acceptance of Terms: By accessing HUTA.LK, you agree to comply with our marketplace guidelines...\n[Full draft available at HUTA.LK]';
    } else if (activeTab === 'privacy') {
      textToCopy = 'HUTA.LK PRIVACY POLICY (DRAFT)\n\n1. Information Collection: We respect your privacy under the Personal Data Protection Act of Sri Lanka...\n[Full draft available at HUTA.LK]';
    } else {
      textToCopy = 'HUTA.LK COOKIE POLICY (DRAFT)\n\n1. Use of Cookies: We use essential cookies and localStorage for shopping cart and theme preferences...\n[Full draft available at HUTA.LK]';
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
          className="relative bg-white dark:bg-[#151822] rounded-3xl max-w-3xl w-full border border-gray-200 dark:border-[#252836] shadow-2xl overflow-hidden my-6 z-10 flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-between shrink-0 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#FF5A36] shadow-inner">
                {activeTab === 'terms' && <FileText className="w-5 h-5 text-[#FF5A36]" />}
                {activeTab === 'privacy' && <Shield className="w-5 h-5 text-emerald-400" />}
                {activeTab === 'cookies' && <Cookie className="w-5 h-5 text-amber-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full text-gray-300">
                    Draft Policy Document
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                    v1.0 Ready
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight mt-0.5">
                  {activeTab === 'terms' && 'Terms & Conditions'}
                  {activeTab === 'privacy' && 'Privacy Policy'}
                  {activeTab === 'cookies' && 'Cookie Policy'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                title="Copy policy summary"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
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
          <div className="flex items-center gap-2 p-2 px-4 bg-gray-50 dark:bg-[#1A1D2B] border-b border-gray-200 dark:border-[#252836] shrink-0 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-white dark:bg-[#151822] text-[#FF5A36] shadow-sm border border-gray-200 dark:border-white/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms & Conditions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-white dark:bg-[#151822] text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-200 dark:border-white/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cookies')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'cookies'
                  ? 'bg-white dark:bg-[#151822] text-amber-600 dark:text-amber-400 shadow-sm border border-gray-200 dark:border-white/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Cookie className="w-3.5 h-3.5" />
              <span>Cookie Policy</span>
            </button>
          </div>

          {/* Modal Body Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs text-gray-700 dark:text-gray-300 leading-relaxed space-y-5">
            {/* ------------------------------------------------------------- */}
            {/* 1. TERMS & CONDITIONS                                         */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <span>📌 Draft Policy Notice</span>
                  </p>
                  <p>
                    These draft Terms & Conditions govern the access and use of HUTA.LK services across all 25 districts of Sri Lanka. You can customize or finalize clauses based on your exact business requirements.
                  </p>
                </div>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    1. Acceptance of Marketplace Terms
                  </h4>
                  <p>
                    Welcome to HUTA.LK (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;). By browsing, registering, posting advertisements, or transacting on HUTA.LK, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the Platform.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    2. Role of HUTA.LK (Direct Buyer-Seller Marketplace)
                  </h4>
                  <p>
                    HUTA.LK serves as an online venue connecting buyers, sellers, and verified merchant E-Stores in Sri Lanka. HUTA.LK is not an auctioneer, retailer, or transport agent, and does not take possession of, inspect, or hold custody of items advertised by peer-to-peer sellers unless explicitly verified under our Merchant Program.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    3. Listing Guidelines & Seller Obligations
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Advertisements must be accurate, truthful, and placed in the appropriate category and district.</li>
                    <li>Sellers must possess the legal right and title to sell the vehicle, property, device, or goods listed.</li>
                    <li>Prices must be stated transparently in Sri Lankan Rupees (LKR) without misleading discounts.</li>
                    <li>Prohibited items include counterfeit goods, illegal substances, unregistered firearms, stolen property, and hazardous materials.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    4. Direct Communication & Safe Trading Protocol
                  </h4>
                  <p>
                    Transactions arranged via direct WhatsApp, telephone, or in-person visits are conducted entirely at the discretion of the buyer and seller. For your safety:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Always inspect high-value items (vehicles, smartphones, electronics, jewelry) in a well-lit, public location before payment.</li>
                    <li>Verify vehicle registration documents (CR books) and property ownership deeds with relevant Sri Lankan authorities.</li>
                    <li>Never send advance deposits or bank transfers to unknown parties without prior verification.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    5. E-Store Merchant Dispatches & Courier Policy
                  </h4>
                  <p>
                    Verified E-Stores listed on HUTA.LK are independent retail merchants responsible for fulfilling orders, managing Cash on Delivery (COD) dispatches, and providing courier tracking details. Any returns or warranties must adhere to the merchant&apos;s published policy.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    6. Limitation of Liability & Governing Law
                  </h4>
                  <p>
                    These Terms are governed by and construed in accordance with the laws of the Democratic Socialist Republic of Sri Lanka. HUTA.LK shall not be held liable for any direct, indirect, or consequential loss arising from peer-to-peer transactions.
                  </p>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 2. PRIVACY POLICY                                             */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-[11px] text-emerald-900 dark:text-emerald-200">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <span>🛡️ Personal Data Protection Act (PDPA) Compliance</span>
                  </p>
                  <p>
                    We respect your privacy and process personal data in compliance with Sri Lanka&apos;s Personal Data Protection Act No. 9 of 2022.
                  </p>
                </div>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    1. Information We Collect
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                    <li><strong>Account Information:</strong> Name, email address, and phone number provided upon registration or post-ad creation.</li>
                    <li><strong>Ad Content:</strong> Photos, item descriptions, price, and location district published by you.</li>
                    <li><strong>Communication Data:</strong> Direct inquiries initiated through our in-app chat or WhatsApp messaging shortcuts.</li>
                    <li><strong>Technical Data:</strong> Browser type, device screen resolution, and IP address for security and fraud prevention.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    2. How We Use Your Data
                  </h4>
                  <p>Your information is used strictly to:</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Publish your classified ads and display your verified contact details to interested local buyers.</li>
                    <li>Calculate district courier fees and generate WhatsApp multi-item orders for E-Store merchants.</li>
                    <li>Detect and prevent spam, fraud, or duplicate fraudulent listings.</li>
                    <li>Provide customer support and verify merchant business registrations.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    3. Data Sharing & Third Parties
                  </h4>
                  <p>
                    We do <strong>not</strong> sell, rent, or trade your personal data to marketing third parties. Data is only shared with:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Local buyers and merchants when you initiate direct inquiries or publish contact numbers on your listings.</li>
                    <li>Google Maps Platform for visual neighborhood discovery (subject to Google Privacy terms).</li>
                    <li>Law enforcement authorities when strictly mandated under the laws of Sri Lanka.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    4. Your Rights & Account Deletion
                  </h4>
                  <p>
                    You have the right to access, edit, or delete your advertisements and account information at any time from your User Dashboard, or by contacting our support team at <strong>support@huta.lk</strong> or WhatsApp <strong>+94 77 526 0765</strong>.
                  </p>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 3. COOKIE POLICY                                              */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'cookies' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <span>🍪 Transparent Cookie & LocalStorage Policy</span>
                  </p>
                  <p>
                    HUTA.LK uses essential cookies and local browser storage to provide a fast, responsive user experience without tracking intrusive ad profiles.
                  </p>
                </div>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    1. What Are Cookies & Local Storage?
                  </h4>
                  <p>
                    Cookies and HTML5 LocalStorage are small data files placed on your browser or phone that allow our website to remember your preferences (such as your chosen district, dark/light theme, and active shopping cart).
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    2. Cookies We Use on HUTA.LK
                  </h4>
                  <div className="border border-gray-200 dark:border-[#252836] rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-100 dark:bg-[#1A1D2B] text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-[#252836]">
                        <tr>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Purpose</th>
                          <th className="p-2.5">Storage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-[#252836]">
                        <tr>
                          <td className="p-2.5 font-bold text-gray-900 dark:text-white">Theme Preference</td>
                          <td className="p-2.5">Remembers your preference between Light Mode and Dark Mode.</td>
                          <td className="p-2.5">LocalStorage</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-gray-900 dark:text-white">Smart Cart</td>
                          <td className="p-2.5">Stores items added to your multi-item WhatsApp checkout cart so you don&apos;t lose them.</td>
                          <td className="p-2.5">LocalStorage</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-gray-900 dark:text-white">Session Security</td>
                          <td className="p-2.5">Maintains your authenticated session when logged in as a seller or admin.</td>
                          <td className="p-2.5">Session / Auth Token</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-gray-900 dark:text-white">District Filter</td>
                          <td className="p-2.5">Remembers your selected location (e.g. Colombo, Kandy, Galle) for convenient browsing.</td>
                          <td className="p-2.5">LocalStorage</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    3. Managing Your Preferences
                  </h4>
                  <p>
                    You can clear cookies or local storage at any time via your browser settings. Note that clearing storage may reset your dark mode preference or shopping cart items.
                  </p>
                </section>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-[#252836] bg-gray-50/80 dark:bg-[#181B26]/80 flex items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Last updated: November 2026 • Democratic Socialist Republic of Sri Lanka
            </span>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-extrabold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
