import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function MarketingPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status:'', dayRecruiterId:'', nightRecruiterId:'', country:'', page:1, limit:20 });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const { data: statuses } = useQuery({ queryKey:['statuses','marketing'], queryFn:()=>api.get('/admin/statuses',{params:{module:'marketing'}}).then(r=>r.data) });
  const { data: users } = useQuery({ queryKey:['users'], queryFn:()=>api.get('/users').then(r=>r.data) });
  const marketers = users?.filter(u=>['MARKETING_MANAGER','DAY_MARKETING_RECRUITER','NIGHT_MARKETING_RECRUITER'].includes(u.role))||[];
  const dayRecruiters = users?.filter(u=>['DAY_MARKETING_RECRUITER','MARKETING_MANAGER'].includes(u.role))||[];
  const nightRecruiters = users?.filter(u=>['NIGHT_MARKETING_RECRUITER','MARKETING_MANAGER'].includes(u.role))||[];

  const { data, isLoading } = useQuery({ queryKey:['marketing',filters], queryFn:()=>api.get('/marketing',{params:filters}).then(r=>r.data) });
  const updateMutation = useMutation({ mutationFn:({candidateId,data})=>api.patch(`/marketing/${candidateId}`,data), onSuccess:()=>{qc.invalidateQueries(['marketing']);setEditingId(null);} });

  const startEdit = (r) => {
    setEditingId(r.candidateId);
    setEditData({ status:r.status, dayRecruiterId:r.dayRecruiterId||'', nightRecruiterId:r.nightRecruiterId||'', dayTeamLeadId:r.dayTeamLeadId||'', nightTeamLeadId:r.nightTeamLeadId||'', candidateNotes:r.candidateNotes||'', clientVendorNotes:r.clientVendorNotes||'' });
  };

  const STATUS_COLOR = { 'In Marketing':'bg-blue-100 text-blue-700','Paused':'bg-red-100 text-red-700','Interviewing':'bg-yellow-100 text-yellow-700','Placed':'bg-green-100 text-green-700','Closed':'bg-gray-100 text-gray-700' };

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Marketing Pipeline</h1><p className="text-gray-500 text-sm">{data?.total||0} candidates in marketing</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {['In Marketing','Paused','Interviewing','Placed','Closed'].map(status=>{
          const count = data?.records?.filter(r=>r.status===status).length||0;
          return <div key={status} onClick={()=>setFilters(p=>({...p,status:p.status===status?'':status,page:1}))} className={`bg-white border rounded-lg p-3 cursor-pointer transition-all ${filters.status===status?'border-orange-500 bg-orange-50':'border-gray-200 hover:border-gray-300'}`}><div className="text-xl font-bold text-gray-900">{count}</div><div className="text-xs text-gray-500 mt-0.5">{status}</div></div>;
        })}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <select value={filters.status} onChange={e=>setFilters(p=>({...p,status:e.target.value,page:1}))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {statuses?.map(s=><option key={s.id} value={s.label}>{s.label}</option>)}
        </select>
        <select value={filters.dayRecruiterId} onChange={e=>setFilters(p=>({...p,dayRecruiterId:e.target.value,page:1}))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Day Recruiters</option>
          {dayRecruiters.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filters.nightRecruiterId} onChange={e=>setFilters(p=>({...p,nightRecruiterId:e.target.value,page:1}))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Night Recruiters</option>
          {nightRecruiters.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filters.country} onChange={e=>setFilters(p=>({...p,country:e.target.value,page:1}))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Countries</option>
          <option value="USA">USA</option><option value="UK">UK</option><option value="CANADA">Canada</option>
        </select>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading?<div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"/></div>:(
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-600">Candidate</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Country</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Day Recruiter</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Night Recruiter</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Day Lead</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Night Lead</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Start Date</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Edit</th>
          </tr></thead>
          <tbody>
            {data?.records?.map(r=>(
              <React.Fragment key={r.id}>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3"><Link to={`/candidates/${r.candidate.id}`} className="font-medium text-blue-600 hover:underline">{r.candidate.firstName} {r.candidate.lastName}</Link><div className="text-gray-400 text-xs">{r.candidate.technology}</div></td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700">{r.candidate.country}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[r.status]||'bg-gray-100 text-gray-700'}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.dayRecruiter?.name||'—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.nightRecruiter?.name||'—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.dayTeamLead?.name||'—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.nightTeamLead?.name||'—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.marketingStartDate?new Date(r.marketingStartDate).toLocaleDateString():'—'}</td>
                  <td className="px-4 py-3"><button onClick={()=>editingId===r.candidateId?setEditingId(null):startEdit(r)} className="text-xs text-blue-600 hover:underline">{editingId===r.candidateId?'Cancel':'Edit'}</button></td>
                </tr>
                {editingId===r.candidateId&&(
                  <tr className="border-b border-orange-200 bg-orange-50"><td colSpan={9} className="px-4 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                        <select value={editData.status} onChange={e=>setEditData(p=>({...p,status:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                          {statuses?.map(s=><option key={s.id} value={s.label}>{s.label}</option>)}
                        </select></div>
                      {[{k:'dayRecruiterId',l:'Day Recruiter',opts:dayRecruiters},{k:'nightRecruiterId',l:'Night Recruiter',opts:nightRecruiters},{k:'dayTeamLeadId',l:'Day Team Lead',opts:marketers},{k:'nightTeamLeadId',l:'Night Team Lead',opts:marketers}].map(({k,l,opts})=>(
                        <div key={k}><label className="text-xs font-medium text-gray-600 mb-1 block">{l}</label>
                          <select value={editData[k]} onChange={e=>setEditData(p=>({...p,[k]:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="">—</option>{opts.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                          </select></div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {[{k:'candidateNotes',l:'Candidate Notes'},{k:'clientVendorNotes',l:'Client / Vendor Notes'}].map(({k,l})=>(
                        <div key={k}><label className="text-xs font-medium text-gray-600 mb-1 block">{l}</label>
                          <textarea value={editData[k]} onChange={e=>setEditData(p=>({...p,[k]:e.target.value}))} rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"/>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>updateMutation.mutate({candidateId:r.candidateId,data:editData})} disabled={updateMutation.isPending} className="bg-orange-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-orange-700 disabled:opacity-50">{updateMutation.isPending?'Saving...':'Save Changes'}</button>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
            {!data?.records?.length&&<tr><td colSpan={9} className="text-center py-12 text-gray-400">No marketing records found</td></tr>}
          </tbody>
        </table>)}
      </div>
    </div>
  );
}
