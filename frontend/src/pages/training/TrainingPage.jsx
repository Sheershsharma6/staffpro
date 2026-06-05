import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

const StarRating = ({ value }) => {
  const colors = { 5:'text-green-600',4:'text-blue-600',3:'text-yellow-600',2:'text-orange-600',1:'text-red-600' };
  return <span className={`font-semibold ${colors[value]||'text-gray-400'}`}>{'★'.repeat(value||0)}{'☆'.repeat(5-(value||0))} {value?`${value}/5`:'—'}</span>;
};

export default function TrainingPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status:'', trainerId:'', country:'', page:1, limit:20 });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const { data: statuses } = useQuery({ queryKey:['statuses','training'], queryFn:()=>api.get('/admin/statuses',{params:{module:'training'}}).then(r=>r.data) });
  const { data: users } = useQuery({ queryKey:['users'], queryFn:()=>api.get('/users').then(r=>r.data) });
  const trainers = users?.filter(u=>['TRAINER','TRAINING_MANAGER'].includes(u.role))||[];
  const { data, isLoading } = useQuery({ queryKey:['training',filters], queryFn:()=>api.get('/training',{params:filters}).then(r=>r.data) });
  const updateMutation = useMutation({ mutationFn:({candidateId,data})=>api.patch(`/training/${candidateId}`,data), onSuccess:()=>{qc.invalidateQueries(['training']);setEditingId(null);} });

  const startEdit = (r) => { setEditingId(r.candidateId); setEditData({ status:r.status, trainerId:r.trainerId||'', technicalRating:r.technicalRating||'', communicationRating:r.communicationRating||'', confidenceRating:r.confidenceRating||'', trainerFeedback:r.trainerFeedback||'', mockInterviewFeedback:r.mockInterviewFeedback||'' }); };

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Training Tracker</h1><p className="text-gray-500 text-sm">{data?.total||0} candidates in training</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {['Evaluation','Training','Interview Prep','Mock Interview Scheduled','Ready for Marketing'].map(status=>{
          const count = data?.records?.filter(r=>r.status===status).length||0;
          return <div key={status} onClick={()=>setFilters(p=>({...p,status:p.status===status?'':status,page:1}))} className={`bg-white border rounded-lg p-3 cursor-pointer transition-all ${filters.status===status?'border-purple-500 bg-purple-50':'border-gray-200 hover:border-gray-300'}`}><div className="text-xl font-bold text-gray-900">{count}</div><div className="text-xs text-gray-500 mt-0.5">{status}</div></div>;
        })}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <select value={filters.status} onChange={e=>setFilters(p=>({...p,status:e.target.value,page:1}))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {statuses?.map(s=><option key={s.id} value={s.label}>{s.label}</option>)}
        </select>
        <select value={filters.trainerId} onChange={e=>setFilters(p=>({...p,trainerId:e.target.value,page:1}))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Trainers</option>
          {trainers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filters.country} onChange={e=>setFilters(p=>({...p,country:e.target.value,page:1}))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Countries</option>
          <option value="USA">USA</option><option value="UK">UK</option><option value="CANADA">Canada</option>
        </select>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading?<div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>:(
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-600">Candidate</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Country</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Trainer</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Tech ★</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Comm ★</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Conf ★</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Edit</th>
          </tr></thead>
          <tbody>
            {data?.records?.map(r=>(
              <React.Fragment key={r.id}>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3"><Link to={`/candidates/${r.candidate.id}`} className="font-medium text-blue-600 hover:underline">{r.candidate.firstName} {r.candidate.lastName}</Link><div className="text-gray-400 text-xs">{r.candidate.technology}</div></td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">{r.candidate.country}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status==='Ready for Marketing'?'bg-green-100 text-green-700':r.status==='Not Responding'?'bg-red-100 text-red-700':'bg-purple-100 text-purple-700'}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.trainer?.name||'—'}</td>
                  <td className="px-4 py-3"><StarRating value={r.technicalRating}/></td>
                  <td className="px-4 py-3"><StarRating value={r.communicationRating}/></td>
                  <td className="px-4 py-3"><StarRating value={r.confidenceRating}/></td>
                  <td className="px-4 py-3"><button onClick={()=>editingId===r.candidateId?setEditingId(null):startEdit(r)} className="text-xs text-blue-600 hover:underline">{editingId===r.candidateId?'Cancel':'Edit'}</button></td>
                </tr>
                {editingId===r.candidateId&&(
                  <tr className="border-b border-purple-200 bg-purple-50"><td colSpan={8} className="px-4 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                        <select value={editData.status} onChange={e=>setEditData(p=>({...p,status:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                          {statuses?.map(s=><option key={s.id} value={s.label}>{s.label}</option>)}
                        </select></div>
                      <div><label className="text-xs font-medium text-gray-600 mb-1 block">Trainer</label>
                        <select value={editData.trainerId} onChange={e=>setEditData(p=>({...p,trainerId:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="">Unassigned</option>
                          {trainers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                        </select></div>
                      {['technicalRating','communicationRating','confidenceRating'].map(field=>(
                        <div key={field}><label className="text-xs font-medium text-gray-600 mb-1 block capitalize">{field.replace('Rating',' Rating')}</label>
                          <select value={editData[field]} onChange={e=>setEditData(p=>({...p,[field]:parseInt(e.target.value)}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="">—</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} ★</option>)}
                          </select></div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {['trainerFeedback','mockInterviewFeedback'].map(field=>(
                        <div key={field}><label className="text-xs font-medium text-gray-600 mb-1 block capitalize">{field==='trainerFeedback'?'Trainer Feedback':'Mock Interview Feedback'}</label>
                          <textarea value={editData[field]} onChange={e=>setEditData(p=>({...p,[field]:e.target.value}))} rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"/>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>updateMutation.mutate({candidateId:r.candidateId,data:editData})} disabled={updateMutation.isPending} className="bg-purple-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-purple-700 disabled:opacity-50">{updateMutation.isPending?'Saving...':'Save Changes'}</button>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
            {!data?.records?.length&&<tr><td colSpan={8} className="text-center py-12 text-gray-400">No training records found</td></tr>}
          </tbody>
        </table>)}
      </div>
    </div>
  );
}
