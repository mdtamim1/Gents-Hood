'use client';

import React, { useState } from 'react';
import {
  Plus,
  Loader2,
  X,
  Shield,
  Edit2,
  Trash2,
  LogOut,
  Eye,
  EyeOff,
  ShoppingBag,
} from 'lucide-react';

interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  isOnline: boolean;
  displayColor: string;
  permissions: Record<string, boolean>;
  lastLoginAt?: string | null;
  createdAt: string;
  _count: { assignedOrders: number };
}

const COLORS = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
];

export function StaffPageClient({
  initialStaff,
  currentUserId,
}: {
  initialStaff: StaffMember[];
  currentUserId: string;
}) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const refreshStaff = async () => {
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      if (data.success) setStaff(data.staff);
    } finally {
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, isActive: !isActive, isOnline: isActive ? false : s.isOnline } : s
        )
      );
    }
  };

  const forceLogout = async (id: string) => {
    const res = await fetch(`/api/admin/staff/${id}/force-logout`, { method: 'POST' });
    if (res.ok) {
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, isOnline: false } : s)));
    }
  };

  const deleteStaff = async (id: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setStaff((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const formatDate = (d?: string | null) => {
    if (!d) return 'Never';
    return new Intl.DateTimeFormat('en-BD', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(d));
  };

  const onlineCount = staff.filter((s) => s.isOnline).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Staff Management</h1>
          <p className="text-[12px] text-white/35">
            {staff.length} members · {onlineCount} online now
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-400"
        >
          <Plus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {staff.map((member) => (
          <div
            key={member.id}
            className={`relative rounded-xl border p-5 transition-all ${
              !member.isActive
                ? 'border-white/[0.04] bg-[#0f0f11] opacity-60'
                : member.isOnline
                  ? 'border-emerald-500/20 bg-[#141416]'
                  : 'border-white/[0.06] bg-[#141416]'
            }`}
          >
            {/* Online badge */}
            <div className="absolute right-4 top-4">
              {member.isOnline ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Online
                </span>
              ) : !member.isActive ? (
                <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-semibold text-red-400">
                  Inactive
                </span>
              ) : (
                <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] text-white/30">
                  Offline
                </span>
              )}
            </div>

            {/* Avatar + Info */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-[15px] font-bold text-white shadow-lg"
                style={{ backgroundColor: member.displayColor }}
              >
                {getInitials(member.name)}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-white">{member.name}</p>
                <p className="text-[12px] text-white/40">{member.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Shield
                    className={`h-3 w-3 ${member.role === 'OWNER' ? 'text-amber-400' : 'text-indigo-400'}`}
                  />
                  <span
                    className={`text-[10px] font-semibold ${member.role === 'OWNER' ? 'text-amber-400' : 'text-indigo-400'}`}
                  >
                    {member.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-white/30" />
                  <span className="text-[11px] text-white/40">Orders</span>
                </div>
                <p className="mt-0.5 text-[16px] font-bold text-white">
                  {member._count.assignedOrders}
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                <p className="text-[11px] text-white/40">Last Login</p>
                <p className="mt-0.5 text-[11px] font-medium text-white/60">
                  {formatDate(member.lastLoginAt)}
                </p>
              </div>
            </div>

            {/* Granted Permissions List */}
            <div className="mt-3 border-t border-white/[0.04] pt-2.5">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                Granted Modules
              </p>
              <div className="flex flex-wrap gap-1">
                {member.role === 'OWNER' ? (
                  <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    👑 Full Store Access
                  </span>
                ) : (
                  <>
                    {Object.entries(member.permissions || {})
                      .filter(([k, v]) => v && k !== 'customers')
                      .map(([key]) => (
                        <span
                          key={key}
                          className="rounded bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold capitalize text-indigo-300"
                        >
                          ✓ {key}
                        </span>
                      ))}
                    {Object.entries(member.permissions || {}).filter(([k, v]) => v && k !== 'customers').length === 0 && (
                      <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400">
                        No permissions
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            {member.id !== currentUserId && (
              <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3">
                <button
                  onClick={() => setEditingStaff(member)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/35 hover:bg-white/[0.07] hover:text-white/70"
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleActive(member.id, member.isActive)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                    member.isActive
                      ? 'text-amber-400/60 hover:bg-amber-500/10 hover:text-amber-400'
                      : 'text-emerald-400/60 hover:bg-emerald-500/10 hover:text-emerald-400'
                  }`}
                  title={member.isActive ? 'Deactivate' : 'Activate'}
                >
                  {member.isActive ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
                {member.isOnline && (
                  <button
                    onClick={() => forceLogout(member.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400/50 hover:bg-red-500/10 hover:text-red-400"
                    title="Force Logout"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => deleteStaff(member.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400/30 hover:bg-red-500/10 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      {(showCreateModal || editingStaff) && (
        <StaffFormModal
          staff={editingStaff}
          onClose={() => {
            setShowCreateModal(false);
            setEditingStaff(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingStaff(null);
            refreshStaff();
          }}
        />
      )}
    </div>
  );
}

function StaffFormModal({
  staff,
  onClose,
  onSuccess,
}: {
  staff: StaffMember | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!staff;
  const [form, setForm] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    password: '',
    role: (staff?.role as 'OWNER' | 'STAFF') || 'STAFF',
    displayColor: staff?.displayColor || COLORS[0],
    permissions: staff?.permissions || {
      orders: true,
      products: false,
      dashboard: false,
      analytics: false,
      settings: false,
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !form.password) {
      setError('Password is required');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const url = isEdit ? `/api/admin/staff/${staff.id}` : '/api/admin/staff';
      const method = isEdit ? 'PATCH' : 'POST';
      const body = isEdit
        ? {
            name: form.name,
            displayColor: form.displayColor,
            role: form.role,
            permissions: form.permissions,
            ...(form.password ? { password: form.password } : {}),
          }
        : { ...form };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to save');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const PERMISSION_OPTIONS = [
    { key: 'orders', label: 'Orders', desc: 'Manage orders, change status, assign courier & print invoice' },
    { key: 'products', label: 'Products', desc: 'Catalog, pricing, stock, variants & signature item' },
    { key: 'dashboard', label: 'Dashboard', desc: 'Store overview, revenue metrics and high-level charts' },
    { key: 'analytics', label: 'Analytics', desc: 'Sales breakdown, trending items & financial analytics' },
    { key: 'settings', label: 'Settings', desc: 'Marquees, banners, FAQs & store configurations' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111113] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-[14px] font-bold text-white">
            {isEdit ? `Edit ${staff.name}` : 'Add New Staff'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-white/50">
                Full Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="Staff Name"
                className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-[13px] text-white outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-white/50">Role</label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as 'OWNER' | 'STAFF' }))
                }
                className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-[13px] text-white outline-none"
              >
                <option value="STAFF">Staff</option>
                <option value="OWNER">Owner</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-white/50">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required={!isEdit}
              disabled={isEdit}
              placeholder="staff@gentshood.com"
              className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-[13px] text-white outline-none focus:border-indigo-500/50 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-white/50">
              Password{' '}
              {isEdit && <span className="text-white/25">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required={!isEdit}
                placeholder={isEdit ? 'New password (optional)' : 'Min 6 characters'}
                className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 pr-10 text-[13px] text-white outline-none focus:border-indigo-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="mb-2 block text-[11px] font-medium text-white/50">
              Display Color
            </label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, displayColor: c }))}
                  className={`h-7 w-7 rounded-full transition-transform ${form.displayColor === c ? 'scale-125 ring-2 ring-white/30' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Permissions */}
          {form.role === 'STAFF' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[11px] font-medium text-white/50">
                  Access Permissions (Select what staff can manage)
                </label>
                <span className="text-[10px] text-indigo-400 font-medium">Strictly Enforced</span>
              </div>
              <div className="space-y-2 rounded-xl border border-white/[0.06] bg-[#0f0f11] p-3 max-h-56 overflow-y-auto">
                {PERMISSION_OPTIONS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-2 py-1 border-b border-white/[0.03] last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-white/90">{item.label}</p>
                      <p className="text-[10px] text-white/40 truncate">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          permissions: { ...f.permissions, [item.key]: !f.permissions[item.key] },
                        }))
                      }
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                        form.permissions[item.key] ? 'bg-indigo-500' : 'bg-white/[0.12]'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          form.permissions[item.key] ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/[0.08] py-2.5 text-[13px] text-white/50 hover:text-white/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-500 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEdit ? 'Save Changes' : 'Create Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
