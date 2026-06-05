import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function PaymentsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('subscriptions');
  const [showPlan, setShowPlan] = useState(false);
  const [planForm, setPlanForm] = useState({ name:'', stripePriceId:'', amount:'', currency:'usd', interval:'month', description:'' });
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [msg, setMsg] = useState('');

  const { data: plans } = useQuery({ queryKey:['plans'], queryFn:()=>api.get('/payments/plans').then(r=>r.data) });
  const { data: candidates } = useQuery({ queryKey:['candidates-search'], queryFn:()=>api.get('/candidates',{params:{limit:200}}).then(r=>r.data) });

  const addPlanMutation = useMutation({ mutationFn:(data)=>api.post('/payments/plans',data), onSuccess:()=>{qc.invalidateQueries(['plans']);setShowPlan(false);setPlanForm({name:'',stripePriceId:'',amount:'',currency:'usd',interval:'month',description:''}); } });

  const createCustomerMutation = useMutation({
    mutationFn:(candidateId)=>api.post('/payments/create-customer',{candidateId}),
    onSuccess:()=>setMsg('Stripe customer created successfully')
  });

  const createSubMutation = useMutation({
    mutationFn:({candidateId,planId})=>api.post('/payments/create-subscription',{candidateId,planId}),
    onSuccess:(data)=>{
      setMsg('Subscription created! Client secret: '+data.data?.clientSecret);
      qc.invalidateQueries(['candidates']);
    }
  });

  const portalMutation = useMutation({
    mutationFn:(candidateId)=>api.get(`/payments/portal/${candidateId}`).then(r=>r.data),
    onSuccess:(data)=>window.open(data.url,'_blank')
  });

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Payments & Subscriptions</h1><p className="text-gray-500 text-sm">Stripe-powered billing management</p></div>
      {msg&&<div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex justify-between"><span>{msg}</span><button onClick={()=>setMsg('')} className="text-green-500 hover:text-green-700">×</button></div>}
      <div className="flex gap-1 border-b border-gray-200">
        {['subscriptions','plans','billing'].map(t=><button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab===t?'border-blue-600 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>)}
      </div>

      {tab==='plans'&&(
        <div className="space-y-4">
          <div className="flex justify-between items-center"><h3 className="font-semibold text-gray-900">Subscription Plans</h3><button onClick={()=>setShowPlan(!showPlan)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">+ Add Plan</button></div>
          {showPlan&&(
            <div className="bg-white border border-blue-200 rounded-xl p-5">
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[{k:'name',l:'Plan Name'},{k:'stripePriceId',l:'Stripe Price ID (price_xxx)'},{k:'amount',l:'Amount',t:'number'},{k:'description',l:'Description'}].map(({k,l,t='text'})=>(
                  <div key={k}><label className="text-xs font-medium text-gray-600 mb-1 block">{l}</label><input type={t} value={planForm[k]} onChange={e=>setPlanForm(p=>({...p,[k]:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/></div>
                ))}
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">Interval</label>
                  <select value={planForm.interval} onChange={e=>setPlanForm(p=>({...p,interval:e.target.value}))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="month">Monthly</option><option value="year">Yearly</option><option value="one_time">One-time</option>
                  </select></div>
              </div>
              <div className="flex gap-3"><button onClick={()=>setShowPlan(false)} className="px-4 py-1.5 border border-gray-300 rounded text-xs text-gray-600">Cancel</button><button onClick={()=>addPlanMutation.mutate(planForm)} disabled={!planForm.name||!planForm.stripePriceId||addPlanMutation.isPending} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-medium disabled:opacity-50">Create Plan</button></div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans?.map(p=>(
              <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2"><span className="font-semibold text-gray-900">{p.name}</span><span className={`px-2 py-0.5 rounded text-xs ${p.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{p.isActive?'Active':'Inactive'}</span></div>
                <div className="text-2xl font-bold text-blue-700">${p.amount}<span className="text-sm text-gray-400 font-normal">/{p.interval}</span></div>
                <div className="text-xs text-gray-400 mt-1">{p.stripePriceId}</div>
                {p.description&&<p className="text-sm text-gray-600 mt-2">{p.description}</p>}
              </div>
            ))}
            {!plans?.length&&<div className="col-span-3 text-center py-8 text-gray-400 bg-white border border-gray-200 rounded-xl">No plans yet. Add your first Stripe plan above.</div>}
          </div>
        </div>
      )}

      {tab==='billing'&&(
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Create Stripe Customer</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1"><label className="text-xs font-medium text-gray-600 mb-1 block">Select Candidate</label>
                <select value={selectedCandidate} onChange={e=>setSelectedCandidate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Choose a candidate...</option>
                  {candidates?.candidates?.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.email}</option>)}
                </select></div>
              <button onClick={()=>createCustomerMutation.mutate(selectedCandidate)} disabled={!selectedCandidate||createCustomerMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Create Customer</button>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Create Subscription</h3>
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-48"><label className="text-xs font-medium text-gray-600 mb-1 block">Candidate</label>
                <select value={selectedCandidate} onChange={e=>setSelectedCandidate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Choose...</option>
                  {candidates?.candidates?.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select></div>
              <div className="flex-1 min-w-48"><label className="text-xs font-medium text-gray-600 mb-1 block">Plan</label>
                <select value={selectedPlan} onChange={e=>setSelectedPlan(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Choose plan...</option>
                  {plans?.map(p=><option key={p.id} value={p.id}>{p.name} — ${p.amount}/{p.interval}</option>)}
                </select></div>
              <button onClick={()=>createSubMutation.mutate({candidateId:selectedCandidate,planId:selectedPlan})} disabled={!selectedCandidate||!selectedPlan||createSubMutation.isPending} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Create Subscription</button>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Open Stripe Customer Portal</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1"><select value={selectedCandidate} onChange={e=>setSelectedCandidate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Choose candidate...</option>
                {candidates?.candidates?.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select></div>
              <button onClick={()=>portalMutation.mutate(selectedCandidate)} disabled={!selectedCandidate||portalMutation.isPending} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Open Portal →</button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Requires the candidate to have a Stripe Customer ID. Create one above first if needed.</p>
          </div>
        </div>
      )}

      {tab==='subscriptions'&&(
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
          <div className="text-4xl mb-3">💳</div>
          <p className="font-medium">Subscription list</p>
          <p className="text-sm mt-1">Query <code className="bg-gray-100 px-1 rounded">/api/payments/history/:candidateId</code> per candidate, or build a global subscription report from the Reports tab.</p>
        </div>
      )}
    </div>
  );
}
