import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

const STATUS_COLOR = { Offered:'bg-yellow-100 text-yellow-700', Accepted:'bg-blue-100 text-blue-700', Started:'bg-purple-100 text-purple-700', Active:'bg-green-100 text-green-700', Ended:'bg-gray-100 text-gray-700', Cancelled:'bg-red-100 text-red-700' };

export default function PlacementPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status:'', country:'', page:1, limit:20 });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ candidateId:'', clientName:'', vendorName:'', jobTitle:'', country:'USA', placementType:'CONTRACT', payRate:'', billRate:'', margin:'', startDate:'', status:'Offered' });

  const { data, isLoading } = useQuery({ queryKey:['placements',filters], queryFn:()=>api.get('/placements',{params:filters}).then(r=>r.data) });
  const { data: candidates } = useQuery({ queryKey:['candidates-search'], queryFn:()=>api.get('/candidates',{params:{limit:200}}).then(r=>r.data) });
  const addMutation = useMutation({ mutationFn:(data)=>api.post('/placements',data), onSuccess:()=>{qc.invalidateQueries(['placements']);setShowAdd(false);} });
  const updateMutation = useMutation({ mutationFn:({id,data})=>api.patch(`/placements/${id}`,data), onSuccess:()=>qc.invalidateQueries(['placements']) });

  const totalRevenue = data?.placements?.reduce((sum,p)=>sum+(p.margin||0),0)||0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Placement Tracker</h1><p className="text-gray-500 text-sm">{data?.total||0} placements</p></div>
        <button onClick={()=>setShowAdd(!showAdd)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">+ Add Placement</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Total',data?.total||0,'bg-blue-50 text-blue-700'],['Active',data?.placements?.filter(p=>p.status==='Active').length||0,'bg-green-50 text-green-700'],['Offered',data?.placements?.filter(p=>p.status==='Offered').length||0,'bg-yellow-50 text-yellow-700'],['Est. Margin',`$${totalRevenue.toFixed(0)}`,'bg-purple-50 text-purple-700']].map(([label,value,cls])=>(
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4"><div className="text-sm text-gray-500 mb-1">{label}</div><div className={`text-2xl font-bold ${cls} px-2 py-0.5 rounded inline-block`}>{value}</div></div>
        ))}
      </div>

      {showAdd&&(
        <div className="bg-white rounded-xl border border-green-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">New Placement</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Candidate <span className="text-red-500">*</span></label>
              <select value={form.candidateId} onChange={e=>setForm(p=>({...p,candidateId:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Select candidate</option>
                {candidates?.candidates?.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select></div>
            {[{k:'clientName',l:'Client Name *'},{k:'vendorName',l:'Vendor Name'},{k:'jobTitle',l:'Job Title *'}].map(({k,l})=>(
              <div key={k}><label className="text-xs font-medium text-gray-600 mb-1 block">{l}</label><input value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/></div>
            ))}
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Country</label>
              <select value={form.country} onChange={e=>setForm(p=>({...p,country:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="USA">USA</option><option value="UK">UK</option><option value="CANADA">Canada</option>
              </select></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
              <select value={form.placementType} onChange={e=>setForm(p=>({...p,placementType:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                {['FULLTIME','CONTRACT','CONTRACT_TO_HIRE','PART_TIME'].map(t=><option key={t} value={t}>{t}</option>)}
              </select></div>
            {[{k:'payRate',l:'Pay Rate ($/hr)'},{k:'billRate',l:'Bill Rate ($/hr)'},{k:'margin',l:'Margin ($)'}].map(({k,l})=>(
              <div key={k}><label className="text-xs font-medium text-gray-600 mb-1 block">{l}</label><input type="number" value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/></div>
            ))}
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Start Date</label><input type="date" value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={()=>setShowAdd(false)} className="px-4 py-1.5 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={()=>addMutation.mutate(form)} disabled={!form.candidateId||!form.clientName||!form.jobTitle||addMutation.isPending} className="bg-green-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50">{addMutation.isPending?'Saving...':'Create Placement'}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
        <select value={filters.status} onChange={e=>setFilters(p=>({...p,status:e.target.value,page:1}))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {['Offered','Accepted','Started','Active','Ended','Cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.country} onChange={e=>setFilters(p=>({...p,country:e.target.value,page:1}))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Countries</option>
          <option value="USA">USA</option><option value="UK">UK</option><option value="CANADA">Canada</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading?<div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"/></div>:(
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-600">Candidate</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Job Title</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Country</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Pay/Bill Rate</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Margin</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Start Date</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
          </tr></thead>
          <tbody>
            {data?.placements?.map(p=>(
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3"><Link to={`/candidates/${p.candidate?.id}`} className="font-medium text-blue-600 hover:underline">{p.candidate?.firstName} {p.candidate?.lastName}</Link></td>
                <td className="px-4 py-3 text-xs text-gray-700">{p.clientName}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{p.jobTitle}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">{p.country}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.placementType}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{p.payRate?`$${p.payRate}`:''}{p.payRate&&p.billRate?' / ':''}{p.billRate?`$${p.billRate}`:''}{!p.payRate&&!p.billRate?'—':''}</td>
                <td className="px-4 py-3 text-xs font-medium text-green-700">{p.margin?`$${p.margin}`:'—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.startDate?new Date(p.startDate).toLocaleDateString():'—'}</td>
                <td className="px-4 py-3">
                  <select value={p.status} onChange={e=>updateMutation.mutate({id:p.id,data:{status:e.target.value}})} className={`border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${STATUS_COLOR[p.status]||'bg-gray-100'} border-transparent`}>
                    {['Offered','Accepted','Started','Active','Ended','Cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!data?.placements?.length&&<tr><td colSpan={9} className="text-center py-12 text-gray-400">No placements yet</td></tr>}
          </tbody>
        </table>)}
      </div>
    </div>
  );
}
