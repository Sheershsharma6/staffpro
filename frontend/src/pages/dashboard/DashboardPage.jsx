import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const StatCard = ({ label, value, icon, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600'
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${colors[color]}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/reports/dashboard').then(r => r.data)
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Candidates" value={data?.totalCandidates} icon="👥" color="blue" />
        <StatCard label="Total Placements" value={data?.totalPlacements} icon="✅" color="green" />
        <StatCard label="Active Placements" value={data?.activePlacements} icon="🔥" color="amber" />
        <StatCard label="Active Subscriptions" value={data?.activeSubscriptions} icon="💳" color="purple" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Country */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Candidates by Country</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.candidatesByCountry}>
              <XAxis dataKey="country" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Recruitment Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Recruitment Pipeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data?.candidatesByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, count }) => `${status}: ${count}`}>
                {data?.candidatesByStatus?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Add Candidate', href: '/candidates/add', color: 'bg-blue-600' },
            { label: 'View Recruitment', href: '/recruitment', color: 'bg-indigo-600' },
            { label: 'Training Board', href: '/training', color: 'bg-purple-600' },
            { label: 'Marketing Pipeline', href: '/marketing', color: 'bg-orange-600' },
            { label: 'View Reports', href: '/reports', color: 'bg-green-600' },
          ].map(({ label, href, color }) => (
            <a key={href} href={href}
              className={`${color} text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity`}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
