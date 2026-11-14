import React, { useState, useEffect, useCallback } from 'react';
import { Users, Award, ShoppingBag, Search, Eye, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import usePagination from '../../../hooks/usePagination';
import AdminPagination from '../components/AdminPagination';
import { formatOrder } from '../../../context/AuthContext';
import { adminUserApi, adminOrderApi } from '../../../utils/api';
import CustomerCreditPanel from '../components/CustomerCreditPanel';

export default function AdminCustomers() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Real customers from the database (all pages), not the browser's cached demo list
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const all = [];
      let page = 1;
      let totalPages = 1;
      do {
        const res = await adminUserApi.getUsers({ page, limit: 200 });
        all.push(...(res?.data?.users || []));
        totalPages = res?.data?.pagination?.totalPages || 1;
        page += 1;
      } while (page <= totalPages);
      setCustomers(all);
    } catch (err) {
      setLoadError(err?.message || 'Could not load customers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Compute CRM Metrics
  const customerList = Array.isArray(customers) ? customers : [];
  const totalSpendAll = customerList.reduce((acc, c) => acc + (Number(c?.totalSpent) || 0), 0);
  const totalOrdersAll = customerList.reduce((acc, c) => acc + (Number(c?.totalOrders) || 0), 0);
  const repeatCustomerCount = customerList.filter(c => (Number(c?.totalOrders) || 0) > 1).length;
  const repeatRate = Math.round((repeatCustomerCount / (customerList.length || 1)) * 100);

  useEffect(() => {
    if (selectedCustomer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedCustomer]);

  const filteredCustomers = customerList.filter(c => {
    if (!c) return false;
    const tier = (c.tier || '').toLowerCase();
    if (tierFilter !== 'All') {
      if (!tier.includes(tierFilter.toLowerCase())) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const name = (c.name || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phone || '');
      const city = (c.city || '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        city.includes(q)
      );
    }
    return true;
  });

  const pagination = usePagination(filteredCustomers, { resetKey: `${tierFilter}|${search}` });

  // Orders of the selected customer — fetched from the server by customer id
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerOrders([]);
      return undefined;
    }
    let cancelled = false;
    setOrdersLoading(true);
    adminOrderApi
      .getAllOrders({ userId: selectedCustomer._id || selectedCustomer.id, limit: 50 })
      .then((res) => {
        if (!cancelled) setCustomerOrders((res?.data?.orders || []).map(formatOrder));
      })
      .catch(() => {
        if (!cancelled) setCustomerOrders([]);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCustomer]);

  return (
    <div className="min-h-screen bg-[color:var(--brand-surface)] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 admin-main flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Customer Relationship Management (CRM)" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4.5 w-full font-sans">
          
          {/* Top CRM KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-xl p-4 border border-[color:var(--brand-border)] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-600 text-xs sm:text-[length:calc(12px*var(--fs))] font-bold uppercase tracking-wider">
                <span>Total Customers</span>
                <Users className="w-4 h-4 text-[color:var(--brand-primary)]" />
              </div>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-[color:var(--brand-primary)]">{customerList.length.toLocaleString('en-IN')}</h2>
              <p className="text-xs text-stone-500 font-medium">Registered member profiles</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[color:var(--brand-border)] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-emerald-800 text-xs sm:text-[length:calc(12px*var(--fs))] font-bold uppercase tracking-wider">
                <span>Repeat Rate</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-emerald-700">{repeatRate}%</h2>
              <p className="text-xs text-stone-500 font-medium">{repeatCustomerCount} recurring subscribers</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[color:var(--brand-border)] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-600 text-xs sm:text-[length:calc(12px*var(--fs))] font-bold uppercase tracking-wider">
                <span>Total CRM Orders</span>
                <ShoppingBag className="w-4 h-4 text-[color:var(--brand-primary)]" />
              </div>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-[color:var(--brand-primary)]">{totalOrdersAll}</h2>
              <p className="text-xs text-stone-500 font-medium">Across all customer accounts</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[color:var(--brand-border)] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-600 text-xs sm:text-[length:calc(12px*var(--fs))] font-bold uppercase tracking-wider">
                <span>Cumulative LTV</span>
                <Award className="w-4 h-4 text-[color:var(--brand-accent)]" />
              </div>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-[color:var(--brand-primary)]">₹{(Number(totalSpendAll) || 0).toLocaleString('en-IN')}</h2>
              <p className="text-xs text-stone-500 font-medium">Total customer lifetime revenue</p>
            </div>
          </div>

          {/* Action Bar & Filter Tabs */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[color:var(--brand-border)] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-[color:var(--brand-surface)] rounded-lg border border-stone-200 text-xs sm:text-sm">
              {['All', 'Gold', 'Platinum', 'Silver'].map(tier => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-3.5 py-1.5 rounded-md font-bold whitespace-nowrap transition-all ${
                    tierFilter === tier
                      ? 'bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tier === 'All' ? 'All Customers' : `${tier} Tier`}
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className="bg-[color:var(--brand-surface)] px-3.5 py-2 rounded-lg border border-stone-200 flex items-center gap-2.5 w-full sm:w-88 text-xs sm:text-sm">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, city, phone..."
                className="bg-transparent focus:outline-none text-xs sm:text-sm w-full text-stone-800 placeholder:text-stone-400 font-medium"
              />
            </div>
          </div>

          {loadError && (
            <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> {loadError}</span>
              <button onClick={loadCustomers} className="inline-flex items-center gap-1 font-bold underline">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}
          {isLoading && customers.length === 0 && !loadError && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-stone-500">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading customers…
            </div>
          )}

          {/* Customers Table */}
          <div className="bg-white rounded-xl border border-[color:var(--brand-border)] shadow-2xs overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left">
                <thead className="bg-[color:var(--brand-primary)] text-[color:var(--brand-border-strong)] uppercase tracking-wider text-xs sm:text-[length:calc(12.5px*var(--fs))] font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Loyalty Tier</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Orders Placed</th>
                    <th className="py-3.5 px-4">Total Spent</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {pagination.pageItems.map(c => {
                    const tierName = c.tier || 'New Customer';
                    const isPlatinum = tierName.includes('Platinum');
                    const isGold = tierName.includes('Gold');
                    const spentNum = Number(c.totalSpent) || 0;
                    const ordersNum = Number(c.totalOrders) || 0;
                    const initial = (c.name || 'C').charAt(0).toUpperCase();

                    return (
                      <tr key={c.id || c._id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3.5">
                            {c.avatar ? (
                              <img
                                src={c.avatar}
                                alt=""
                                className="w-11 h-11 rounded-full object-cover border border-stone-200 bg-[color:var(--brand-surface)] shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full border border-[color:var(--brand-accent)]/40 bg-[color:var(--brand-surface)] text-[color:var(--brand-primary)] font-bold text-sm flex items-center justify-center shrink-0">
                                {initial}
                              </div>
                            )}
                            <div>
                              <div className="font-sans font-bold text-sm sm:text-[length:calc(15px*var(--fs))] text-[color:var(--brand-primary)]">{c.name || 'Customer'}</div>
                              <div className="text-xs sm:text-[length:calc(12px*var(--fs))] text-stone-500 font-medium">{c.email || 'No email'} • {c.phone || 'No phone'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            isPlatinum
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : isGold
                              ? 'bg-[color:var(--brand-accent)]/20 text-[color:var(--brand-primary)] border border-[color:var(--brand-accent)]/40'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}>
                            {tierName}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-stone-700 text-xs sm:text-sm font-medium">
                          {c.city ? `${c.city}${c.state ? `, ${c.state}` : ''}` : '—'}
                        </td>

                        <td className="py-3 px-4 font-semibold text-stone-900 text-xs sm:text-sm">
                          {ordersNum} orders
                        </td>

                        <td className="py-3 px-4 font-bold text-[color:var(--brand-primary)] text-sm sm:text-base">
                          ₹{spentNum.toLocaleString('en-IN')}
                          {c.credit && (c.credit.eligible || c.credit.blocked || c.credit.used > 0) && (
                            <div className={`text-[length:calc(11px*var(--fs))] font-semibold mt-0.5 ${c.credit.blocked ? 'text-rose-700' : 'text-sky-700'}`}>
                              {c.credit.blocked
                                ? 'Credit blocked'
                                : `Credit: ₹${Math.round(c.credit.available).toLocaleString('en-IN')} of ₹${Math.round(c.credit.limit).toLocaleString('en-IN')} free`}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[color:var(--brand-primary)] hover:text-[color:var(--brand-accent)] px-3.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors shadow-2xs"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Profile</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <AdminPagination pagination={pagination} label="registered customers" />
          </div>

        </main>
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div 
          data-lenis-prevent
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCustomer(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs font-sans overflow-y-auto"
        >
          <div 
            data-lenis-prevent
            className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col my-auto"
          >
            
            {/* Header */}
            <div className="p-4 sm:p-5 bg-[color:var(--brand-primary)] text-white flex items-center justify-between border-b border-[color:var(--brand-accent)]/30 shrink-0">
              <div className="flex items-center gap-3.5">
                {selectedCustomer.avatar ? (
                  <img src={selectedCustomer.avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-[color:var(--brand-accent)]" />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-[color:var(--brand-accent)] bg-[color:var(--brand-surface)] text-[color:var(--brand-primary)] font-bold text-lg flex items-center justify-center">
                    {(selectedCustomer.name || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <span className="text-[length:calc(10px*var(--fs))] font-bold uppercase tracking-widest text-[color:var(--brand-accent)]">{selectedCustomer.tier || 'Member'}</span>
                  <h3 className="font-sans text-base sm:text-xl font-bold mt-0.5">{selectedCustomer.name || 'Customer'}</h3>
                  <p className="text-xs text-stone-300">Customer since {selectedCustomer.memberSince || 'Member'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 font-sans">
              {/* Contact Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[color:var(--brand-surface)] border border-[color:var(--brand-border)] text-xs sm:text-sm">
                <div>
                  <span className="text-stone-500 block text-[length:calc(11px*var(--fs))] font-bold uppercase">Phone</span>
                  <strong className="text-stone-800 font-semibold">{selectedCustomer.phone || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block text-[length:calc(11px*var(--fs))] font-bold uppercase">Email</span>
                  <strong className="text-stone-800 font-semibold truncate block">{selectedCustomer.email || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block text-[length:calc(11px*var(--fs))] font-bold uppercase">Lifetime Spend</span>
                  <strong className="text-[color:var(--brand-primary)] font-bold">₹{(Number(selectedCustomer.totalSpent) || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <CustomerCreditPanel
                customerId={selectedCustomer._id || selectedCustomer.id}
                onSaved={(credit) => {
                  const id = selectedCustomer._id || selectedCustomer.id;
                  setCustomers((prev) => prev.map((c) => ((c._id || c.id) === id ? { ...c, credit } : c)));
                }}
              />

              {/* Order History */}
              <div className="space-y-3">
                <h4 className="font-sans text-sm sm:text-base font-bold text-[color:var(--brand-primary)]">Order History ({customerOrders.length})</h4>
                {ordersLoading ? (
                  <p className="text-xs text-stone-400 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading orders…</p>
                ) : customerOrders.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No placed orders found for this customer.</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map(ord => (
                      <div key={ord.id} className="p-3 rounded-lg border border-stone-200 flex items-center justify-between text-xs sm:text-sm hover:bg-stone-50 transition-colors">
                        <div>
                          <div className="font-bold text-[color:var(--brand-primary)]">#{ord.id} • <span className="font-normal text-stone-500">{ord.date}</span></div>
                          <p className="text-xs text-stone-500 mt-0.5">{ord.items?.length || 1} items • {ord.deliveryType}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-stone-900 text-sm">₹{ord.total}</div>
                          <span className="text-[length:calc(11px*var(--fs))] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="p-4 border-t border-stone-200 bg-[color:var(--brand-surface)] flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 rounded-lg bg-[color:var(--brand-primary)] text-white text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[color:var(--brand-primary-light)] transition-colors"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
