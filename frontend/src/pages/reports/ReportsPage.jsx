import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../lib/api';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'];

const Card = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5"><h3 className="font-semibold text-gray-900 mb-4">{title}</h3>{children}</div>
);

export default function ReportsPage() {
  const [tab, setTab] = useState('recruitment');
  const tabs = ['recruitment','training','marketing','placement','interviews','payments'];

  const { data: recData } = useQuery({ queryKey:['reports','recruitment'], queryFn:()=>api.get('/reports/recruitment').then(r=>r.data), enabled:tab==='recruitment' });
  const { data: trainData } = useQuery({ queryKey:['reports','training'], queryFn:()=>api.get('/reports/training').then(r=>r.data), enabled:tab==='training' });
  const { data: mktData } = useQuery({ queryKey:['reports','marketing'], queryFn:()=>api.get('/reports/marketing').then(r=>r.data), enabled:tab==='marketing' });
  const { data: plcData } = useQuery({ queryKey:['reports','placement'], queryFn:()=>api.get('/reports/placement').then(r=>r.data), enabled:tab==='placement' });
  const { data: intData } = useQuery({ queryKey:['reports','interviews'], queryFn:()=>api.get('/reports/interviews').then(r=>r.data), enabled:tab==='interviews' });
  const { data: payData } = useQuery({ queryKey:['reports','payments'], queryFn:()=>api.get('/reports/payments').then(r=>r.data), enabled:tab==='payments' });

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1></div>
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t=><button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab===t?'border-blue-600 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>)}
      </div>

      {tab==='recruitment'&&recData&&(
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title="Candidates by Recruitment Status">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={recData.byStatus}><XAxis dataKey="status" tick={{fontSize:10}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:11}}/><Tooltip/><Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]}/></BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Pipeline Summary">
            <div className="space-y-2">
              {recData.byStatus?.map((s,i)=>(
                <div key={s.status} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:COLORS[i%COLORS.length]}}/>
                  <span className="text-sm text-gray-700 flex-1">{s.status}</span>
                  <span className="font-semibold text-gray-900">{s.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab==='training'&&trainData&&(
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title="Candidates by Training Status">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trainData.byStatus}><XAxis dataKey="status" tick={{fontSize:10}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:11}}/><Tooltip/><Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]}/></BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Average Ratings">
            {trainData.avgRatings?._avg&&(
              <div className="space-y-4 pt-2">
                {[['Technical',trainData.avgRatings._avg.technicalRating],['Communication',trainData.avgRatings._avg.communicationRating],['Confidence',trainData.avgRatings._avg.confidenceRating]].map(([label,val])=>(
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{label}</span><span className="font-semibold">{val?`${val.toFixed(1)}/5`:'—'}</span></div>
                    <div className="h-2 bg-gray-100 rounded-full"><div className="h-2 bg-purple-500 rounded-full" style={{width:`${((val||0)/5)*100}%`}}/></div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab==='marketing'&&mktData&&(
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title="Candidates by Marketing Status">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart><Pie data={mktData.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label={({status,count})=>`${status}: ${count}`}>
                {mktData.byStatus?.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie><Tooltip/></PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Status Breakdown">
            <div className="space-y-2">
              {mktData.byStatus?.map((s,i)=>(
                <div key={s.status} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{background:COLORS[i%COLORS.length]}}/>
                  <span className="text-sm text-gray-700 flex-1">{s.status}</span>
                  <span className="font-semibold text-gray-900">{s.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab==='placement'&&plcData&&(
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title="Placements by Status">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={plcData.byStatus}><XAxis dataKey="status" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Bar dataKey="count" fill="#10b981" radius={[4,4,0,0]}/></BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Revenue Summary">
            <div className="space-y-3">
              <div className="bg-green-50 rounded-lg p-4"><div className="text-sm text-gray-500">Total Margin</div><div className="text-3xl font-bold text-green-700 mt-1">${(plcData.revenueStats?._sum?.margin||0).toFixed(0)}</div></div>
              <div className="bg-blue-50 rounded-lg p-4"><div className="text-sm text-gray-500">Avg Margin</div><div className="text-2xl font-bold text-blue-700 mt-1">${(plcData.revenueStats?._avg?.margin||0).toFixed(0)}</div></div>
              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">By Country</div>
                {plcData.byCountry?.map(c=><div key={c.country} className="flex justify-between text-sm py-1 border-b border-gray-100"><span className="text-gray-600">{c.country}</span><span className="font-semibold">{c._count?.id||0}</span></div>)}
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab==='interviews'&&intData&&(
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card title="By Type"><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={intData.byType} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={70} label={({type,count})=>`${type}: ${count}`}>{intData.byType?.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></Card>
          <Card title="By Result"><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={intData.byResult} dataKey="count" nameKey="result" cx="50%" cy="50%" outerRadius={70} label={({result,count})=>`${result}: ${count}`}>{intData.byResult?.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></Card>
          <Card title="By Status"><div className="space-y-2">{intData.byStatus?.map((s,i)=><div key={s.status} className="flex items-center gap-3"><div className="w-2 h-2 rounded-full" style={{background:COLORS[i%COLORS.length]}}/><span className="text-sm text-gray-700 flex-1">{s.status}</span><span className="font-semibold">{s.count}</span></div>)}</div></Card>
        </div>
      )}

      {tab==='payments'&&payData&&(
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[['Total Revenue',`$${(payData.totalRevenue||0).toFixed(2)}`,'bg-green-50 text-green-700'],['Active Subscriptions',payData.activeSubscriptions,'bg-blue-50 text-blue-700'],['Cancelled Subs',payData.canceledSubscriptions,'bg-gray-50 text-gray-700'],['Failed Payments',payData.failedPayments,'bg-red-50 text-red-700']].map(([label,value,cls])=>(
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5"><div className="text-sm text-gray-500 mb-1">{label}</div><div className={`text-2xl font-bold px-2 py-0.5 rounded inline-block ${cls}`}>{value}</div></div>
          ))}
        </div>
      )}
    </div>
  );
}
