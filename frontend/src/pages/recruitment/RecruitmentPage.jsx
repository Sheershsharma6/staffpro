import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

const STATUS_COLORS = {
  'New Lead': 'bg-gray-100 text-gray-700', 'Contacted': 'bg-blue-100 text-blue-700',
  'Not Responding': 'bg-red-100 text-red-700', 'Interested': 'bg-green-100 text-green-700',
  'Agreement Sent': 'bg-yellow-100 text-yellow-700', 'Agreement Signed': 'bg-emerald-100 text-emerald-700',
  'Rejected': 'bg-red-100 text-red-700', 'Sent to Training': 'bg-purple-100 text-purple-700',
  'Sent to Marketing': 'bg-orange-100 text-orange-700'
};

export default function RecruitmentPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: '', country: '', page: 1, limit: 20 });
  const { data: statuses } = useQuery({
    queryKey: ['statuses', 'recruitment'],
    queryFn: () => api.get('/admin/statuses', { params: { module: 'recruitment' } }).then(r => r.data)
  });
  const { data, isLoading } = useQuery({
    queryKey: ['recruitment', filters],
    queryFn: () => api.get('/recruitment', { params: filters }).then(r => r.data)
  });
  const updateMutation = useMutation({
    mutationFn: ({ candidateId, data }) => api.patch(`/recruitment/${candidateId}`, data),
    onSuccess: () => qc.invalidateQueries(['recruitment'])
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment Tracker</h1>
          <p className="text-gray-500 text-sm">{data?.total || 0} candidates in pipeline</p>
        </div>
        <Link to="/candidates/add" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Candidate</Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value, page: 1 }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {statuses?.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
        </select>
        <select value={filters.country} onChange={e => setFilters(p => ({ ...p, country: e.target.value, page: 1 }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Countries</option>
          <option value="USA">USA</option><option value="UK">UK</option><option value="CANADA">Canada</option>
        </select>
        <select value={filters.agreementSent} onChange={e => setFilters(p => ({ ...p, agreementSent: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Agreement Status</option>
          <option value="true">Agreement Sent</option>
          <option value="false">Not Sent</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Candidate</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Country</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Agreement</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Recruiter</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Follow Up</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.records?.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/candidates/${r.candidate.id}`} className="font-medium text-blue-600 hover:underline">
                      {r.candidate.firstName} {r.candidate.lastName}
                    </Link>
                    <div className="text-gray-400 text-xs">{r.candidate.email}</div>
                  </td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">{r.candidate.country}</span></td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-700'}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {r.agreementSigned ? '✅ Signed' : r.agreementSent ? '📧 Sent' : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.candidate.assignedRecruiter?.name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.followUpDate ? new Date(r.followUpDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <select value={r.status}
                      onChange={e => updateMutation.mutate({ candidateId: r.candidateId, data: { status: e.target.value } })}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                      {statuses?.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {!data?.records?.length && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No records found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
