import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

const MODULES = ['recruitment','training','marketing','interview','placement'];
const MODULE_COLOR = { recruitment:'blue', training:'purple', marketing:'orange', interview:'teal', placement:'green' };

export default function AdminPage() {
  const qc = useQueryClient();
  const [activeModule, setActiveModule] = useState('recruitment');
  const [form, setForm] = useState({ label:'', color:'#3b82f6', order:0 });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: statuses, isLoading } = useQuery({
    queryKey:['statuses', activeModule],
    queryFn:()=>api.get('/admin/statuses',{params:{module:activeModule}}).then(r=>r.data)
  });

  const addMutation = useMutation({ mutationFn:(data)=>api.post('/admin/statuses',data), onSuccess:()=>{qc.invalidateQueries(['statuses']);setForm({label:'',color:'#3b82f6',order:0});} });
  const updateMutation = useMutation({ mutationFn:({id,data})=>api.patch(`/admin/statuses/${id}`,data), onSuccess:()=>{qc.invalidateQueries(['statuses']);setEditId(null);} });
  const deleteMutation = useMutation({ mutationFn:(id)=>api.delete(`/admin/statuses/${id}`), onSuccess:()=>qc.invalidateQueries(['statuses']) });

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1><p className="text-gray-500 text-sm">Configure statuses for all modules</p></div>
      <div className="flex gap-2 flex-wrap">
        {MODULES.map(m=><button key={m} onClick={()=>setActiveModule(m)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeModule===m?'bg-blue-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>{m}</button>)}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 capitalize">{activeModule} Statuses</h3>
        <div className="flex gap-3 mb-4">
          <input value={form.label} onChange={e=>setForm(p=>({...p,label:e.target.value}))} placeholder="Status label" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          <input type="color" value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"/>
          <input type="number" value={form.order} onChange={e=>setForm(p=>({...p,order:parseInt(e.target.value)}))} placeholder="Order" className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          <button onClick={()=>addMutation.mutate({...form,module:activeModule})} disabled={!form.label||addMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Add Status</button>
        </div>
        {isLoading?<div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>:(
          <div className="space-y-2">
            {statuses?.map(s=>(
              <div key={s.id} className="flex items-center gap-3 border border-gray-100 rounded-lg p-3 hover:bg-gray-50">
                <div className="w-4 h-4 rounded flex-shrink-0" style={{background:s.color}}/>
                {editId===s.id?(
                  <div className="flex gap-2 flex-1 items-center">
                    <input value={editForm.label} onChange={e=>setEditForm(p=>({...p,label:e.target.value}))} className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                    <input type="color" value={editForm.color} onChange={e=>setEditForm(p=>({...p,color:e.target.value}))} className="w-8 h-8 border border-gray-300 rounded cursor-pointer"/>
                    <input type="number" value={editForm.order} onChange={e=>setEditForm(p=>({...p,order:parseInt(e.target.value)}))} className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                    <button onClick={()=>updateMutation.mutate({id:s.id,data:editForm})} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Save</button>
                    <button onClick={()=>setEditId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                  </div>
                ):(
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-800">{s.label}</span>
                    <span className="text-xs text-gray-400">Order: {s.order}</span>
                    <button onClick={()=>{setEditId(s.id);setEditForm({label:s.label,color:s.color,order:s.order});}} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={()=>{if(confirm(`Delete "${s.label}"?`))deleteMutation.mutate(s.id);}} className="text-xs text-red-500 hover:underline">Delete</button>
                  </>
                )}
              </div>
            ))}
            {!statuses?.length&&<p className="text-gray-400 text-sm text-center py-4">No statuses configured for {activeModule}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
