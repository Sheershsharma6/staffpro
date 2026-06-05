import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const COUNTRY_BADGE = { USA: 'bg-blue-100 text-blue-700', UK: 'bg-purple-100 text-purple-700', CANADA: 'bg-red-100 text-red-700' };
const STATUS_COLORS = {
  'New Lead': 'bg-gray-100 text-gray-700', 'Contacted': 'bg-blue-100 text-blue-700',
  'Interested': 'bg-green-100 text-green-700', 'Agreement Sent': 'bg-yellow-100 text-yellow-700',
  'Agreement Signed': 'bg-emerald-100 text-emerald-700', 'Rejected': 'bg-red-100 text-red-700'
};

export default function CandidateListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', country: '', page: 1, limit: 20 });

  const { data, isLoading } = useQuery({
    queryKey: ['candidates', filters],
    queryFn: () => api.get('/candidates', { params: filters }).then(r => r.data)
  });

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: 1 }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total || 0} total candidates</p>
        </div>
        <Link to="/candidates/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
          + Add Candidate
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Search name, email, skill..."
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={filters.country} onChange={e => setFilter('country', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Countries</option>
          <option value="USA">USA</option>
          <option value="UK">UK</option>
          <option value="CANADA">Canada</option>
        </select>
        <button onClick={() => setFilters({ search: '', country: '', page: 1, limit: 20 })}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-300 rounded-lg">
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Candidate</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Country</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Technology</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Recruitment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Training</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Marketing</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Added By</th>
              </tr>
            </thead>
            <tbody>
              {data?.candidates?.map(c => (
                <tr key={c.id} onClick={() => navigate(`/candidates/${c.id}`)}
                  className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.firstName} {c.lastName}</div>
                    <div className="text-gray-500 text-xs">{c.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${COUNTRY_BADGE[c.country]}`}>
                      {c.country}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.technology || '—'}</td>
                  <td className="px-4 py-3">
                    {c.recruitment?.status && (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[c.recruitment.status] || 'bg-gray-100 text-gray-700'}`}>
                        {c.recruitment.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.training?.status || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.marketing?.status || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs capitalize">{c.source || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.addedBy?.name || '—'}</td>
                </tr>
              ))}
              {!data?.candidates?.length && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No candidates found</td></tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data?.total > data?.limit && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {((filters.page - 1) * filters.limit) + 1}–{Math.min(filters.page * filters.limit, data.total)} of {data.total}
            </span>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1 rounded border text-sm disabled:opacity-50 hover:bg-gray-50">←</button>
              <button disabled={filters.page * filters.limit >= data.total} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1 rounded border text-sm disabled:opacity-50 hover:bg-gray-50">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
