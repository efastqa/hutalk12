import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  Users,
  Search,
  ShieldCheck,
  Cloud,
  RefreshCw,
  Info,
  Phone,
  Mail,
  Lock,
  Layers,
  ArrowDownToLine,
  Check
} from 'lucide-react';
import { Listing, User, EStore } from '../types';
import { api } from '../services/api';

interface AdminDataBackupProps {
  listings: Listing[];
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const BACKUP_TIMESTAMP_KEY = 'huta_last_backup_timestamp';

export const AdminDataBackup: React.FC<AdminDataBackupProps> = ({ listings, onToast }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [eStores, setEStores] = useState<EStore[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lastBackupDate, setLastBackupDate] = useState<string>(() => {
    try {
      return localStorage.getItem(BACKUP_TIMESTAMP_KEY) || '';
    } catch {
      return '';
    }
  });

  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  // Load all registered customers and stores
  useEffect(() => {
    let isMounted = true;
    setIsLoadingUsers(true);

    Promise.all([api.getAllUsers(), api.getEStores()])
      .then(([allUsers, allStores]) => {
        if (!isMounted) return;
        setUsers(allUsers);
        setEStores(allStores);
      })
      .catch((err) => {
        console.error('Error fetching data for backup:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingUsers(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateBackupTimestamp = () => {
    const now = new Date().toISOString();
    setLastBackupDate(now);
    try {
      localStorage.setItem(BACKUP_TIMESTAMP_KEY, now);
    } catch {}
  };

  const formatTimestamp = (isoString: string) => {
    if (!isoString) return 'No backup recorded yet';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-LK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Helper to trigger browser file download
  const triggerDownload = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    updateBackupTimestamp();
  };

  // Export 1: Customers CSV
  const handleExportCustomersCSV = () => {
    setDownloadingType('customers_csv');
    try {
      const headers = ['Customer ID', 'Full Name', 'Username', 'Email', 'Phone Number', 'Registration Date', 'Total Ads Posted', '2FA Active'];
      
      const rows = users.map((u) => {
        const userAdsCount = listings.filter((l) => l.userId === u.id || (u.phone && l.phone && l.phone.includes(u.phone.slice(-7)))).length;
        return [
          `"${u.id}"`,
          `"${(u.fullname || '').replace(/"/g, '""')}"`,
          `"${(u.username || '').replace(/"/g, '""')}"`,
          `"${(u.email || '').replace(/"/g, '""')}"`,
          `"${(u.phone || '').replace(/"/g, '""')}"`,
          `"${u.created || 'N/A'}"`,
          userAdsCount,
          u.twoFactorEnabled ? 'YES' : 'NO',
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const dateStr = new Date().toISOString().split('T')[0];
      triggerDownload(`huta-customers-backup-${dateStr}.csv`, csvContent, 'text/csv;charset=utf-8;');
      
      if (onToast) onToast('Customer accounts backup CSV downloaded successfully!', 'success');
    } catch (err: any) {
      if (onToast) onToast(err.message || 'Failed to export customers CSV', 'error');
    } finally {
      setTimeout(() => setDownloadingType(null), 800);
    }
  };

  // Export 2: Classified Ads CSV
  const handleExportListingsCSV = () => {
    setDownloadingType('listings_csv');
    try {
      const headers = [
        'Ad ID',
        'Title',
        'Category',
        'District',
        'Price (LKR)',
        'Seller Name',
        'Seller Phone',
        'Status',
        'Created Date',
        'Views Count',
        'WhatsApp Inquiries',
        'Verified Pro',
      ];

      const rows = listings.map((l) => [
        `"${l.id}"`,
        `"${(l.title || '').replace(/"/g, '""')}"`,
        `"${(l.category || '').replace(/"/g, '""')}"`,
        `"${(l.location || '').replace(/"/g, '""')}"`,
        l.price || 0,
        `"${(l.sellerName || 'Private Seller').replace(/"/g, '""')}"`,
        `"${(l.phone || '').replace(/"/g, '""')}"`,
        `"${l.status}"`,
        `"${l.date || l.createdAt || 'N/A'}"`,
        l.views || 0,
        l.whatsappClicks || 0,
        l.isVerifiedPro ? 'YES' : 'NO',
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const dateStr = new Date().toISOString().split('T')[0];
      triggerDownload(`huta-classifieds-backup-${dateStr}.csv`, csvContent, 'text/csv;charset=utf-8;');
      
      if (onToast) onToast('Classified ads & seller contacts CSV downloaded!', 'success');
    } catch (err: any) {
      if (onToast) onToast(err.message || 'Failed to export listings CSV', 'error');
    } finally {
      setTimeout(() => setDownloadingType(null), 800);
    }
  };

  // Export 3: Complete Raw JSON Snapshot
  const handleExportFullJSON = () => {
    setDownloadingType('full_json');
    try {
      const fullSnapshot = {
        meta: {
          platform: 'HUTA.LK Marketplace & E-Stores Sri Lanka',
          database: 'Google Cloud Firebase Firestore',
          projectId: 'ai-studio-hutamarketplace-a40b0e5f-a550-4b3c-9fe4-5d24c3006539',
          snapshotDate: new Date().toISOString(),
          totalCustomers: users.length,
          totalListings: listings.length,
          totalStores: eStores.length,
        },
        customers: users,
        listings: listings,
        stores: eStores,
      };

      const jsonStr = JSON.stringify(fullSnapshot, null, 2);
      const nowStr = new Date().toISOString().replace(/[:.]/g, '-');
      triggerDownload(`huta-full-database-backup-${nowStr}.json`, jsonStr, 'application/json');

      if (onToast) onToast('Full database JSON snapshot exported successfully!', 'success');
    } catch (err: any) {
      if (onToast) onToast(err.message || 'Failed to export full JSON snapshot', 'error');
    } finally {
      setTimeout(() => setDownloadingType(null), 800);
    }
  };

  // Filtered customers for search table
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const q = searchTerm.toLowerCase().trim();
    return users.filter(
      (u) =>
        (u.fullname || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q)
    );
  }, [users, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#181920] via-[#1E2230] to-[#181920] text-white p-5 sm:p-7 rounded-3xl border border-[#2D303E] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5A36]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF5A36] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#FF5A36]/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Customer & Marketplace Data Backup
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 uppercase">
                  <CheckCircle2 className="w-3 h-3" /> Live Firestore
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 max-w-xl leading-relaxed">
                Download instant offline backups of all customer accounts, registration dates, phone contacts, classified ads, and e-stores.
              </p>
            </div>
          </div>

          {/* Backup Date Tracker Badge */}
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex flex-col justify-center min-w-[220px]">
            <span className="text-[10px] text-gray-300 uppercase font-black tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#FF5A36]" />
              <span>Last Backup Date & Time</span>
            </span>
            <span className="text-sm font-black text-white mt-0.5">
              {formatTimestamp(lastBackupDate)}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">
              ● Database Synced & Ready
            </span>
          </div>
        </div>
      </div>

      {/* 3 Quick Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Customer Accounts CSV */}
        <div className="bg-white dark:bg-[#151822] p-5 rounded-2xl border border-gray-200 dark:border-[#2D303E] shadow-sm hover:border-[#FF5A36]/50 transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
              Customer Accounts CSV
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Full list of registered customers, registration dates, names, emails, phone numbers & security stats.
            </p>
            <div className="mt-3 text-xs font-bold text-gray-700 dark:text-gray-300">
              Total Records: <span className="text-blue-600 dark:text-blue-400 font-black">{users.length} Customers</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCustomersCSV}
            disabled={downloadingType === 'customers_csv'}
            className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {downloadingType === 'customers_csv' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>Download Customers (.CSV)</span>
          </button>
        </div>

        {/* Card 2: Classified Ads CSV */}
        <div className="bg-white dark:bg-[#151822] p-5 rounded-2xl border border-gray-200 dark:border-[#2D303E] shadow-sm hover:border-[#FF5A36]/50 transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
              Classified Ads & Contacts CSV
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              All marketplace listings with seller contact numbers, districts, prices, categories, and views.
            </p>
            <div className="mt-3 text-xs font-bold text-gray-700 dark:text-gray-300">
              Total Records: <span className="text-emerald-600 dark:text-emerald-400 font-black">{listings.length} Listings</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportListingsCSV}
            disabled={downloadingType === 'listings_csv'}
            className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {downloadingType === 'listings_csv' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowDownToLine className="w-4 h-4" />
            )}
            <span>Download Listings (.CSV)</span>
          </button>
        </div>

        {/* Card 3: Full JSON Snapshot */}
        <div className="bg-white dark:bg-[#151822] p-5 rounded-2xl border border-gray-200 dark:border-[#2D303E] shadow-sm hover:border-[#FF5A36]/50 transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
              Complete System Snapshot (JSON)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Complete raw JSON dump of customers, classifieds, stores, and stories for migration or offline archiving.
            </p>
            <div className="mt-3 text-xs font-bold text-gray-700 dark:text-gray-300">
              Includes: <span className="text-purple-600 dark:text-purple-400 font-black">All DB Collections</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportFullJSON}
            disabled={downloadingType === 'full_json'}
            className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {downloadingType === 'full_json' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Export Full Database (.JSON)</span>
          </button>
        </div>
      </div>

      {/* Customer Accounts & Registration Dates Table */}
      <div className="bg-white dark:bg-[#151822] rounded-3xl border border-gray-200 dark:border-[#2D303E] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-[#2D303E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              Customer Directory & Registration Dates
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Review customer join dates, telephone numbers, and advertisement activity
            </p>
          </div>

          {/* Search filter for customers */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1E2230] px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone or email..."
              className="bg-transparent border-none outline-none text-xs text-gray-900 dark:text-white w-full placeholder:text-gray-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {isLoadingUsers ? (
          <div className="p-12 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#FF5A36]" />
            <span>Loading customer records from Firestore...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No customer accounts found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#1A1C25] text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider text-[10px] border-b border-gray-200 dark:border-[#2D303E]">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4">Ads Posted</th>
                  <th className="py-3 px-4">Security</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#252836] text-gray-800 dark:text-gray-200">
                {filteredUsers.map((u) => {
                  const userAds = listings.filter((l) => l.userId === u.id || (u.phone && l.phone && l.phone.includes(u.phone.slice(-7))));
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/70 dark:hover:bg-[#1E2230]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#FF5A36]/15 text-[#FF5A36] flex items-center justify-center font-bold text-xs shrink-0">
                            {((u.fullname || u.username || 'U').trim().charAt(0) || 'U').toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">
                              {u.fullname || u.username}
                            </div>
                            <div className="text-[10px] text-gray-400">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium">
                        {u.phone ? (
                          <a
                            href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{u.phone}</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-gray-600 dark:text-gray-300">
                        {u.email ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{u.email}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-semibold">
                          <Calendar className="w-3 h-3 text-[#FF5A36]" />
                          <span>{u.created ? new Date(u.created).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Earlier Member'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1E2230] text-gray-700 dark:text-gray-300 text-[11px]">
                          <span>{userAds.length} ads</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {u.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3" /> 2FA Active
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">Standard</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Advisory & Cloud Architecture Guide */}
      <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Admin Advisory — How Backups Work on HUTA.LK</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
          <div className="space-y-1.5">
            <p className="font-extrabold text-amber-950 dark:text-white">
              1. Web Admin Instant Downloads (CSV & JSON)
            </p>
            <p>
              Use the buttons above whenever you want a local copy of your customers or classifieds. CSV files open directly in Microsoft Excel, Apple Numbers, and Google Sheets for mailing lists, customer support, or reports.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="font-extrabold text-amber-950 dark:text-white">
              2. Google Cloud Platform (GCP) Automatic Backups
            </p>
            <p>
              Your database is hosted on Google Cloud Firestore (<code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">ai-studio-hutamarketplace...</code>). Google automatically provides multi-region redundancy and can run scheduled daily exports to a Cloud Storage bucket via <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">gcloud firestore export</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
