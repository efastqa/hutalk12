import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Server,
  Zap,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  Info,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { SmsGatewayStatus, SmsDeliveryLog } from '../types';

interface AdminSmsGatewayProps {
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminSmsGateway: React.FC<AdminSmsGatewayProps> = ({ onToast }) => {
  const [gatewayData, setGatewayData] = useState<SmsGatewayStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testPhone, setTestPhone] = useState('+94775260765');
  const [testMessage, setTestMessage] = useState('HUTA Sri Lanka: Test SMS dispatch verification. System online and operational.');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<{
    success: boolean;
    provider: string;
    details: string;
    logId: string;
    phone: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSmsGatewayStatus();
      setGatewayData(data);
    } catch (err: any) {
      if (onToast) onToast('Failed to load SMS Gateway status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      if (onToast) onToast('Please enter a destination phone number', 'error');
      return;
    }

    setIsSendingTest(true);
    setLastTestResult(null);

    try {
      const res = await api.testSmsGateway(testPhone.trim(), testMessage.trim());
      setLastTestResult(res);
      if (onToast) onToast(`Test SMS dispatched successfully via ${res.provider}!`, 'success');
      // Refresh status to pull new log
      fetchStatus();
    } catch (err: any) {
      if (onToast) onToast(err.message || 'SMS dispatch test failed', 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    if (onToast) onToast(`${label} copied to clipboard`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'notify.lk':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Zap className="w-3 h-3 text-emerald-600" />
            Notify.lk (Sri Lanka Direct)
          </span>
        );
      case 'custom_gateway':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
            <Server className="w-3 h-3 text-blue-600" />
            Custom HTTP Webhook
          </span>
        );
      case 'twilio':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-300">
            <Server className="w-3 h-3 text-purple-600" />
            Twilio Global
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Simulation & Console Mode
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF5A36] flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-gray-900">
                  Automated SMS Gateway & OTP Service
                </h3>
                {gatewayData && getProviderBadge(gatewayData.activeProvider)}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Delivers customer OTP login verification, seller ad inquiries, and transaction alerts to Sri Lankan mobile networks (Dialog, Mobitel, Airtel, Hutch).
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStatus}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Requests</p>
          <p className="text-2xl font-black text-gray-900 mt-1">
            {gatewayData?.stats.total ?? 0}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Dispatched since startup</p>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Network Delivered</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {gatewayData?.stats.sent ?? 0}
          </p>
          <p className="text-[10px] text-emerald-600 mt-0.5">Confirmed via telecom SMS</p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 bg-amber-50/30 p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Simulated / Queue</p>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {gatewayData?.stats.simulated ?? 0}
          </p>
          <p className="text-[10px] text-amber-600 mt-0.5">Test codes logged</p>
        </div>

        <div className="bg-white rounded-2xl border border-rose-100 bg-rose-50/30 p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Failed Dispatches</p>
          <p className="text-2xl font-black text-rose-700 mt-1">
            {gatewayData?.stats.failed ?? 0}
          </p>
          <p className="text-[10px] text-rose-600 mt-0.5">Delivery exceptions</p>
        </div>
      </div>

      {/* Main Grid: Test Dispatcher & Environment Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Test Console */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-[#FF5A36]" />
              <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
                Live SMS Test Console
              </h4>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Send a test SMS message immediately to test connectivity through the active gateway.
            </p>

            <form onSubmit={handleSendTest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Recipient Mobile Number (Sri Lanka Format)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+94 77 526 0765 or 0775260765"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20 outline-none transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Accepts +94..., 94..., or local format (077...). Automatically formatted to international standards.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  SMS Message Body
                </label>
                <textarea
                  rows={3}
                  required
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20 outline-none transition-all"
                />
                <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
                  <span>Standard 1-part SMS: max 160 characters</span>
                  <span>{testMessage.length} / 160 characters</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingTest || !testPhone.trim()}
                className="w-full bg-[#FF5A36] hover:bg-[#E04826] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSendingTest ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting to Gateway...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Real Test SMS</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {lastTestResult && (
            <div className={`mt-4 p-3.5 rounded-xl border text-xs ${
              lastTestResult.success
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dispatch Completed via {lastTestResult.provider}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-700">
                {lastTestResult.details}
              </p>
              <div className="mt-2 text-[10px] text-gray-500 font-mono">
                Log ID: {lastTestResult.logId} • Destination: {lastTestResult.phone}
              </div>
            </div>
          )}
        </div>

        {/* Right: Supported Gateways & Setup Instructions */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
                Gateway Configuration & Environment
              </h4>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              To connect a live Sri Lankan telecommunication SMS provider, add the credentials in your Cloud / Server environment variables.
            </p>

            <div className="space-y-3">
              {/* Notify.lk Option */}
              <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-gray-900">Notify.lk (Recommended for Sri Lanka)</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    gatewayData?.providers.notifyLk.configured
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {gatewayData?.providers.notifyLk.configured ? 'Configured' : 'Optional'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Direct SMS routes to all 4 Sri Lankan telecom operators with custom sender ID.
                </p>
                <div className="mt-2 text-[11px] font-mono bg-white p-2 rounded-lg border border-gray-200 text-gray-700 flex items-center justify-between">
                  <span>NOTIFYLK_USER_ID, NOTIFYLK_API_KEY, NOTIFYLK_SENDER_ID</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('NOTIFYLK_USER_ID=\nNOTIFYLK_API_KEY=\nNOTIFYLK_SENDER_ID=HUTA', 'Notify.lk Keys')}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 cursor-pointer"
                    title="Copy environment variable template"
                  >
                    {copiedKey === 'Notify.lk Keys' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Custom HTTP Webhook */}
              <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-gray-900">Dialog IdeaBiz / Custom Webhook</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    gatewayData?.providers.customGateway.configured
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {gatewayData?.providers.customGateway.configured ? 'Configured' : 'Optional'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Any HTTP REST API endpoint or webhook accepting JSON payloads.
                </p>
                <div className="mt-2 text-[11px] font-mono bg-white p-2 rounded-lg border border-gray-200 text-gray-700 flex items-center justify-between">
                  <span>SMS_GATEWAY_URL, SMS_GATEWAY_API_KEY</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('SMS_GATEWAY_URL=\nSMS_GATEWAY_API_KEY=\nSMS_GATEWAY_SENDER_ID=HUTA', 'Custom Gateway Keys')}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 cursor-pointer"
                    title="Copy environment variable template"
                  >
                    {copiedKey === 'Custom Gateway Keys' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              All API keys are securely stored server-side only.
            </span>
          </div>
        </div>
      </div>

      {/* Bottom: Live Delivery Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
              Live SMS Transmission Logs
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              History of one-time passwords (OTP) and system alerts dispatched to mobile users.
            </p>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            Showing last {gatewayData?.recentLogs.length ?? 0} dispatches
          </span>
        </div>

        {gatewayData && gatewayData.recentLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="pb-2.5 font-bold">Timestamp</th>
                  <th className="pb-2.5 font-bold">Recipient</th>
                  <th className="pb-2.5 font-bold">Gateway Provider</th>
                  <th className="pb-2.5 font-bold">Status</th>
                  <th className="pb-2.5 font-bold">Message Snippet</th>
                  <th className="pb-2.5 font-bold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gatewayData.recentLogs.map((log: SmsDeliveryLog) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('en-LK', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 font-mono font-bold text-gray-900 whitespace-nowrap">
                      {log.recipient}
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      <span className="capitalize font-semibold text-gray-700">
                        {log.provider.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Delivered
                        </span>
                      ) : log.status === 'simulated' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Simulated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-gray-600 max-w-xs truncate" title={log.message}>
                      {log.message}
                    </td>
                    <td className="py-2.5 text-[11px] text-gray-500 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400 text-xs bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            No SMS messages have been sent yet in this session. Use the test console above to trigger a dispatch!
          </div>
        )}
      </div>
    </div>
  );
};
