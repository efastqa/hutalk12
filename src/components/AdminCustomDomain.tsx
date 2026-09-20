import React, { useState, useEffect } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Server,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { CustomDomainStatus } from '../types';

interface AdminCustomDomainProps {
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminCustomDomain: React.FC<AdminCustomDomainProps> = ({ onToast }) => {
  const [domainInput, setDomainInput] = useState('huta.lk');
  const [domainStatus, setDomainStatus] = useState<CustomDomainStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const checkDomain = async (targetDomain = domainInput) => {
    setIsChecking(true);
    try {
      const res = await api.checkCustomDomain(targetDomain.trim());
      setDomainStatus(res);
      if (onToast) {
        if (res.isConfigured) {
          onToast(`DNS for ${res.domain} verified: Connected to Google Cloud!`, 'success');
        } else {
          onToast(`DNS records checked for ${res.domain}`, 'info');
        }
      }
    } catch (err: any) {
      if (onToast) onToast('Failed to query domain DNS records', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkDomain('huta.lk');
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    if (onToast) onToast(`${label} copied to clipboard`, 'success');
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF5A36] flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-gray-900">
                  Custom Domain Setup (huta.lk)
                </h3>
                {domainStatus?.isConfigured ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Live & Connected
                  </span>
                ) : domainStatus?.status === 'pointing_other' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Pending DNS Update
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-700 border border-gray-300">
                    <Clock className="w-3 h-3 text-gray-500" />
                    Awaiting DNS
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Map your official Sri Lankan brand domain <span className="font-bold text-gray-800">huta.lk</span> and <span className="font-bold text-gray-800">www.huta.lk</span> to this Cloud Run marketplace with automatic free Google SSL.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => checkDomain()}
            disabled={isChecking}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Verify Live DNS</span>
          </button>

          <a
            href={`https://${domainStatus?.domain || 'huta.lk'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0"
          >
            <span>Visit huta.lk</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Domain Verification Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            checkDomain();
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-mono text-xs">
              https://
            </span>
            <input
              type="text"
              required
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="huta.lk"
              className="w-full pl-18 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20 outline-none transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isChecking}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isChecking ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Querying Worldwide DNS...</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" />
                <span>Check DNS Status</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Live DNS Inspection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Apex Domain Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Apex Domain</span>
            {domainStatus?.isApexConfigured ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                Connected
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                DNS Action Required
              </span>
            )}
          </div>
          <p className="text-base font-black text-gray-900 font-mono">{domainStatus?.domain || 'huta.lk'}</p>
          <div className="mt-3 text-xs">
            <span className="text-gray-500 block text-[11px] mb-1 font-bold">Current Live A Records:</span>
            {domainStatus?.liveDns.apexA && domainStatus.liveDns.apexA.length > 0 ? (
              <div className="space-y-1">
                {domainStatus.liveDns.apexA.map((ip) => (
                  <div key={ip} className="font-mono text-[11px] bg-gray-50 px-2 py-1 rounded border border-gray-200 flex items-center justify-between">
                    <span>{ip}</span>
                    {domainStatus.requiredRecords.apexA.targetIps.includes(ip) ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <span className="text-[10px] text-amber-600 font-medium">External Host</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 italic text-[11px]">No A records found</span>
            )}
          </div>
        </div>

        {/* WWW Subdomain Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">WWW Subdomain</span>
            {domainStatus?.isWwwConfigured ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                Connected
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                DNS Action Required
              </span>
            )}
          </div>
          <p className="text-base font-black text-gray-900 font-mono">www.{domainStatus?.domain || 'huta.lk'}</p>
          <div className="mt-3 text-xs">
            <span className="text-gray-500 block text-[11px] mb-1 font-bold">Current Live CNAME / IP:</span>
            {domainStatus?.liveDns.wwwCname && domainStatus.liveDns.wwwCname.length > 0 ? (
              <div className="font-mono text-[11px] bg-gray-50 px-2 py-1 rounded border border-gray-200">
                {domainStatus.liveDns.wwwCname.join(', ')}
              </div>
            ) : domainStatus?.liveDns.wwwA && domainStatus.liveDns.wwwA.length > 0 ? (
              <div className="font-mono text-[11px] bg-gray-50 px-2 py-1 rounded border border-gray-200">
                {domainStatus.liveDns.wwwA.join(', ')}
              </div>
            ) : (
              <span className="text-gray-400 italic text-[11px]">No CNAME or A records found</span>
            )}
          </div>
        </div>

        {/* SSL & Target URL Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">SSL Certificate</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
              Auto-Managed
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 font-black text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Google Auto TLS/SSL</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Once DNS records are propagated, Google Cloud automatically provisions free, auto-renewing HTTPS certificates.
          </p>
          <div className="mt-3 text-[10px] text-gray-400 font-mono truncate" title={domainStatus?.currentAppUrl}>
            Backend: {domainStatus?.currentAppUrl}
          </div>
        </div>
      </div>

      {/* Required DNS Records Table (Ready to Copy) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
              Required DNS Records (Enter in your Domain Registrar)
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Copy these 5 DNS records into your LK Domain Registry (nic.lk / domains.lk) or Cloudflare DNS manager:
            </p>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(
              `Type: A | Host: @ | Value: 216.239.32.21\nType: A | Host: @ | Value: 216.239.34.21\nType: A | Host: @ | Value: 216.239.36.21\nType: A | Host: @ | Value: 216.239.38.21\nType: CNAME | Host: www | Value: ghs.googlehosted.com`,
              'All DNS Records'
            )}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            {copiedText === 'All DNS Records' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy All Records</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                <th className="pb-2.5 font-bold">Type</th>
                <th className="pb-2.5 font-bold">Host / Name</th>
                <th className="pb-2.5 font-bold">Target / IP Value</th>
                <th className="pb-2.5 font-bold">TTL</th>
                <th className="pb-2.5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {[
                { type: 'A', host: '@', value: '216.239.32.21', label: 'A Record 1' },
                { type: 'A', host: '@', value: '216.239.34.21', label: 'A Record 2' },
                { type: 'A', host: '@', value: '216.239.36.21', label: 'A Record 3' },
                { type: 'A', host: '@', value: '216.239.38.21', label: 'A Record 4' },
                { type: 'CNAME', host: 'www', value: 'ghs.googlehosted.com', label: 'CNAME Record' },
              ].map((rec) => (
                <tr key={rec.value} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rec.type === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {rec.type}
                    </span>
                  </td>
                  <td className="py-2.5 font-bold text-gray-900">{rec.host}</td>
                  <td className="py-2.5 text-gray-800 font-bold">{rec.value}</td>
                  <td className="py-2.5 text-gray-500 font-sans">3600 (Auto)</td>
                  <td className="py-2.5 text-right font-sans">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(rec.value, rec.label)}
                      className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-900 transition-colors cursor-pointer inline-flex items-center gap-1"
                      title={`Copy ${rec.value}`}
                    >
                      {copiedText === rec.label ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px]">Copy</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Sri Lanka LK Domain Registry (nic.lk / domains.lk) Guide */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#FF5A36]" />
          <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
            Step-by-Step Instructions for nic.lk (LK Domain Registry)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="w-6 h-6 rounded-full bg-[#FF5A36] text-white flex items-center justify-center font-bold text-xs mb-2">
                1
              </div>
              <h5 className="font-bold text-gray-900 text-xs mb-1">Log in to Registrar</h5>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Visit <a href="https://www.nic.lk" target="_blank" rel="noopener noreferrer" className="text-[#FF5A36] underline font-bold">nic.lk</a> or <a href="https://domains.lk" target="_blank" rel="noopener noreferrer" className="text-[#FF5A36] underline font-bold">domains.lk</a> and sign in to your domain management account.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="w-6 h-6 rounded-full bg-[#FF5A36] text-white flex items-center justify-center font-bold text-xs mb-2">
                2
              </div>
              <h5 className="font-bold text-gray-900 text-xs mb-1">Select huta.lk</h5>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Go to <span className="font-bold text-gray-700">My Domains</span>, click on <span className="font-bold text-gray-700">huta.lk</span>, and select <span className="font-bold text-gray-700">Manage DNS / Zone Records</span>.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="w-6 h-6 rounded-full bg-[#FF5A36] text-white flex items-center justify-center font-bold text-xs mb-2">
                3
              </div>
              <h5 className="font-bold text-gray-900 text-xs mb-1">Enter 5 Records</h5>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Add the 4 A records pointing <span className="font-bold text-gray-700">@</span> to the Google IPs, and 1 CNAME record pointing <span className="font-bold text-gray-700">www</span> to <span className="font-mono text-gray-700">ghs.googlehosted.com</span>.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="w-6 h-6 rounded-full bg-[#FF5A36] text-white flex items-center justify-center font-bold text-xs mb-2">
                4
              </div>
              <h5 className="font-bold text-gray-900 text-xs mb-1">Verify & Go Live</h5>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Click <span className="font-bold text-gray-700">"Verify Live DNS"</span> above. Propagation takes between 10 minutes to 2 hours. Your site will automatically secure with SSL!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center gap-2 text-xs text-blue-800">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Cloudflare Users:</strong> If using Cloudflare for DNS management, set the records to <strong>DNS Only (Grey Cloud)</strong> during initial SSL handshake verification so Google can issue the SSL certificate directly.
          </span>
        </div>
      </div>
    </div>
  );
};
