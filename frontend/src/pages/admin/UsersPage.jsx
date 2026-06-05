import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

const ROLES = ['SUPER_ADMIN','ADMIN','RECRUITMENT_MANAGER','SALES_RECRUITER','TRAINING_MANAGER','TRAINER','MARKETING_MANAGER','DAY_MARKETING_RECRUITER','NIGHT_MARKETING_RECRUITER','PLACEMENT_MANAGER','FINANCE_ADMIN','CANDIDATE_CUSTOMER'];

export default function UsersPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'SALES_RECRUITER', country:'', shiftType:'' });
  const [editId, setEditId] = useState(null);

  const { data: users, isLoading } = useQuery({ queryKey:['users'], queryFn:()=>api.get('/users').then(r=>r.data) });
  const addMutation = useMutation({ mutationFn:(data)=>api.post('/users',data), onSuccess:()=>{qc.invalidateQueries(['users']);setShowAdd(false);setForm({name:'',email:'',password:'',role:'SALES_RECRUITER',country:'',shiftType:''});} });
  const updateMutation = useMutation({ mutationFn:({id,data})=>api.patch(`/users/${id}`,data), onSuccess:()=>{qc.invalidateQueries(['users']);setEditId(null);} });
  const deactivateMutation = useMutation({ mutationFn:(id)=>api.delete(`/users/${id}`), onSuccess:()=>qc.invalidateQueries(['users']) });

  const ROLE_COLOR = { SUPER_ADMIN:'bg-red-100 text-red-700', ADMIN:'bg-orange-100 text-orange-700', RECRUITMENT_MANAGER:'bg-blue-100 text-blue-700', SALES_RECRUITER:'bg-blue-50 text-blue-600', TRAINING_MANAGER:'bg-purple-100 text-purple-700', TRAINER:'bg-purple-50 text-purple-600', MARKETING_MANAGER:'bg-orange-100 text-orange-700', DAY_MARKETING_RECRUITER:'bg-yellow-100 text-yellow-700', NIGHT_MARKETING_RECRUITER:'bg-indigo-100 text-indigo-700', PLACEMENT_MANAGER:'bg-green-100 text-green-700', FINANCE_ADMIN:'bg-emerald-100 text-emerald-700', CANDIDATE_CUSTOMER:'bg-gray-100 text-gray-600' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">User Management</h1><p className="text-gray-500 text-sm">{users?.length||0} users</p></div>
        <button onClick={()=>setShowAdd(!showAdd)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Add User</button>
      </div>

      {showAdd&&(
        <div className="bg-white border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">New User</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[{k:'name',l:'Full Name'},{k:'email',l:'Email',t:'email'},{k:'password',l:'Password',t:'password'}].map(({k,l,t='text'})=>(
              <div key={k}><label className="text-xs font-medium text-gray-600 mb-1 block">{l}</label><input type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/></div>
            ))}
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Role</label>
              <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                {ROLES.map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
              </select></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Country</label>
              <select value={form.country} onChange={e=>setForm(p=>({...p,country:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">—</option><option value="USA">USA</option><option value="UK">UK</option><option value="CANADA">Canada</option>
              </select></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Shift</label>
              <select value={form.shiftType} onChange={e=>setForm(p=>({...p,shiftType:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">—</option><option value="DAY">Day</option><option value="NIGHT">Night</option>
              </select></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={()=>setShowAdd(false)} className="px-4 py-1.5 border border-gray-300 rounded text-xs text-gray-600">Cancel</button>
            <button onClick={()=>addMutation.mutate(form)} disabled={!form.name||!form.email||!form.password||addMutation.isPending} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-medium disabled:opacity-50">{addMutation.isPending?'Creating...':'Create User'}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading?<div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>:(
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Country</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Shift</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr></thead>
          <tbody>
            {users?.map(u=>(
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLOR[u.role]||'bg-gray-100 text-gray-700'}`}>{u.role.replace(/_/g,' ')}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{u.country||'—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{u.shiftType||'—'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${u.isActive?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={()=>updateMutation.mutate({id:u.id,data:{isActive:!u.isActive}})} className="text-xs text-blue-600 hover:underline">{u.isActive?'Deactivate':'Reactivate'}</button>
                </td>
              </tr>
            ))}
            {!users?.length&&<tr><td colSpan={7} className="text-center py-12 text-gray-400">No users found</td></tr>}
          </tbody>
        </table>)}
      </div>
    </div>
  );
}
