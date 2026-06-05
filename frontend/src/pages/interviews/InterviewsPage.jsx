import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

const RESULT_COLOR = { SELECTED:'bg-green-100 text-green-700', REJECTED:'bg-red-100 text-red-700', PENDING:'bg-gray-100 text-gray-700', NEXT_ROUND:'bg-blue-100 text-blue-700', NO_SHOW:'bg-orange-100 text-orange-700', WAITING:'bg-yellow-100 text-yellow-700' };

export default function InterviewsPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ type:'', status:'', page:1, limit:20 });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ candidateId:'', type:'interview', clientName:'', vendorName:'', jobTitle:'', jobLocation:'', scheduledAt:'', interviewType:'VIDEO', roundNumber:1, status:'Scheduled', feedback:'', result:'PENDING', nextStep:'' });

  const { data, isLoading } = useQuery({ queryKey:['interviews',filters], queryFn:()=>api.get('/interviews',{params:filters}).then(r=>r.data) });
  const { data: candidates } = useQuery({ queryKey:['candidates-search'], queryFn:()=>api.get('/candidates',{params:{limit:200}}).then(r=>r.data) });

  const addMutation = useMutation({ mutationFn:(data)=>api.post('/interviews',data), onSuccess:()=>{qc.invalidateQueries(['interviews']);setShowAdd(false);} });
  const updateMutation = useMutation({ mutationFn:({id,data})=>api.patch(`/interviews/${id}`,data), onSuccess:()=>qc.invalidateQueries(['interviews']) });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Interviews / Screenings / Assessments</h1><p className="text-gray-500 text-sm">{data?.total||0} records</p></div>
        <button onClick={()=>setShowAdd(!showAdd)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Record</button>
      </div>

      {showAdd&&(
        <div className="bg-white rounded-xl border border-blue-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">New Interview / Screening / Assessment</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Candidate <span className="text-red-500">*</span></label>
              <select value={form.candidateId} onChange={e=>setForm(p=>({...p,candidateId:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Select candidate</option>
                {candidates?.candidates?.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
              <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="interview">Interview</option><option value="screening">Screening</option><option value="assessment">Assessment</option>
              </select></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Client / Vendor</label><input value={form.clientName} onChange={e=>setForm(p=>({...p,clientName:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Job Title</label><input value={form.jobTitle} onChange={e=>setForm(p=>({...p,jobTitle:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Scheduled At</label><input type="datetime-local" value={form.scheduledAt} onChange={e=>setForm(p=>({...p,scheduledAt:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Interview Type</label>
              <select value={form.interviewType} onChange={e=>setForm(p=>({...p,interviewType:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                {['PHONE','VIDEO','ONSITE','TECHNICAL','HR','PANEL'].map(t=><option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Round #</label><input type="number" value={form.roundNumber} onChange={e=>setForm(p=>({...p,roundNumber:parseInt(e.target.value)}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
              <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                {['Scheduled','Completed','Rescheduled','No Show','Selected','Rejected','Waiting for Feedback','Next Round'].map(s=><option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Result</label>
              <select value={form.result} onChange={e=>setForm(p=>({...p,result:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                {['PENDING','SELECTED','REJECTED','WAITING','NEXT_ROUND','NO_SHOW'].map(r=><option key={r} value={r}>{r}</option>)}
              </select></div>
          </div>
          <div className="mt-3"><label className="text-xs font-medium text-gray-600 mb-1 block">Feedback</label><textarea value={form.feedback} onChange={e=>setForm(p=>({...p,feedback:e.target.value}))} rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"/></div>
          <div className="flex gap-3 mt-4">
            <button onClick={()=>setShowAdd(false)} className="px-4 py-1.5 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={()=>addMutation.mutate(form)} disabled={!form.candidateId||addMutation.isPending} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50">{addMutation.isPending?'Saving...':'Create'}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
        <select value={filters.type} onChange={e=>setFilters(p=>({...p,type:e.target.value,page:1}))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Types</option><option value="interview">Interview</option><option value="screening">Screening</option><option value="assessment">Assessment</option>
        </select>
        <select value={filters.status} onChange={e=>setFilters(p=>({...p,status:e.target.value,page:1}))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {['Scheduled','Completed','Rescheduled','No Show','Selected','Rejected','Waiting for Feedback','Next Round'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading?<div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>:(
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-600">Candidate</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Job Title</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Scheduled</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Round</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Result</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Update</th>
          </tr></thead>
          <tbody>
            {data?.interviews?.map(i=>(
              <tr key={i.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3"><Link to={`/candidates/${i.candidate?.id}`} className="font-medium text-blue-600 hover:underline">{i.candidate?.firstName} {i.candidate?.lastName}</Link><div className="text-gray-400 text-xs">{i.candidate?.country}</div></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${i.type==='interview'?'bg-blue-100 text-blue-700':i.type==='screening'?'bg-purple-100 text-purple-700':'bg-yellow-100 text-yellow-700'}`}>{i.type}</span></td>
                <td className="px-4 py-3 text-xs text-gray-700">{i.clientName||'—'}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{i.jobTitle||'—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{i.scheduledAt?new Date(i.scheduledAt).toLocaleString():'—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500 text-center">{i.roundNumber}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{i.status}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${RESULT_COLOR[i.result]||'bg-gray-100 text-gray-700'}`}>{i.result}</span></td>
                <td className="px-4 py-3">
                  <select value={i.result} onChange={e=>updateMutation.mutate({id:i.id,data:{result:e.target.value,status:e.target.value==='SELECTED'?'Selected':e.target.value==='REJECTED'?'Rejected':i.status}})} className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                    {['PENDING','SELECTED','REJECTED','WAITING','NEXT_ROUND','NO_SHOW'].map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!data?.interviews?.length&&<tr><td colSpan={9} className="text-center py-12 text-gray-400">No records found</td></tr>}
          </tbody>
        </table>)}
      </div>
    </div>
  );
}
