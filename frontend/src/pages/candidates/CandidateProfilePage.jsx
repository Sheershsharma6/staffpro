import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

const TABS = ['Profile', 'Recruitment', 'Training', 'Marketing', 'Interviews', 'Placement', 'Payments', 'Timeline'];

const Badge = ({ text, className = '' }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${className}`}>{text}</span>
);

const InfoRow = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="text-gray-500 text-sm min-w-36">{label}</span>
    <span className="text-sm text-gray-900 font-medium">{value || '—'}</span>
  </div>
);

export default function CandidateProfilePage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('Profile');
  const [note, setNote] = useState('');
  const [noteModule, setNoteModule] = useState('general');

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => api.get(`/candidates/${id}`).then(r => r.data)
  });

  const noteMutation = useMutation({
    mutationFn: (data) => api.post(`/candidates/${id}/notes`, data),
    onSuccess: () => { qc.invalidateQueries(['candidate', id]); setNote(''); }
  });

  const updateRecruitment = useMutation({
    mutationFn: (data) => api.patch(`/recruitment/${id}`, data),
    onSuccess: () => qc.invalidateQueries(['candidate', id])
  });

  const updateTraining = useMutation({
    mutationFn: (data) => api.patch(`/training/${id}`, data),
    onSuccess: () => qc.invalidateQueries(['candidate', id])
  });

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!candidate) return <div className="text-center py-16 text-gray-500">Candidate not found</div>;

  return (
    <div className="max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
            {candidate.firstName[0]}{candidate.lastName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{candidate.firstName} {candidate.lastName}</h1>
            <p className="text-gray-500 text-sm">{candidate.email} • {candidate.phone}</p>
            <div className="flex gap-2 mt-1">
              <Badge text={candidate.country} className="bg-blue-100 text-blue-700" />
              {candidate.technology && <Badge text={candidate.technology} className="bg-purple-100 text-purple-700" />}
              {candidate.workAuthorization && <Badge text={candidate.workAuthorization} className="bg-green-100 text-green-700" />}
            </div>
          </div>
        </div>
        {candidate.resumePath && (
          <a href={candidate.resumePath} target="_blank" rel="noreferrer"
            className="text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
            📄 View Resume
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>{tab}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {activeTab === 'Profile' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Basic Information</h3>
            <InfoRow label="Full Name" value={`${candidate.firstName} ${candidate.lastName}`} />
            <InfoRow label="Email" value={candidate.email} />
            <InfoRow label="Phone" value={candidate.phone} />
            <InfoRow label="Country" value={candidate.country} />
            <InfoRow label="Location" value={candidate.location} />
            <InfoRow label="Technology" value={candidate.technology} />
            <InfoRow label="Experience" value={candidate.yearsOfExperience ? `${candidate.yearsOfExperience} years` : null} />
            <InfoRow label="Work Auth" value={candidate.workAuthorization} />
            <InfoRow label="Source" value={candidate.source} />
            <InfoRow label="Added By" value={candidate.addedBy?.name} />
            <InfoRow label="Added At" value={new Date(candidate.createdAt).toLocaleDateString()} />
            {candidate.resumeParsedData?.skills?.length > 0 && (
              <div>
                <span className="text-gray-500 text-sm">Parsed Skills</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {candidate.resumeParsedData.skills.map(s => (
                    <span key={s} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Recruitment' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Recruitment Status</h3>
            {candidate.recruitment ? (
              <div className="space-y-3">
                <InfoRow label="Status" value={candidate.recruitment.status} />
                <InfoRow label="Agreement Sent" value={candidate.recruitment.agreementSent ? `Yes — ${candidate.recruitment.agreementSentAt ? new Date(candidate.recruitment.agreementSentAt).toLocaleDateString() : ''}` : 'No'} />
                <InfoRow label="Agreement Signed" value={candidate.recruitment.agreementSigned ? 'Yes' : 'No'} />
                <InfoRow label="Follow Up Date" value={candidate.recruitment.followUpDate ? new Date(candidate.recruitment.followUpDate).toLocaleDateString() : null} />
                <InfoRow label="Sent to Training" value={candidate.recruitment.sentToTraining ? 'Yes' : 'No'} />
                <InfoRow label="Sent to Marketing" value={candidate.recruitment.sentToMarketing ? 'Yes' : 'No'} />

                <div className="pt-2 flex gap-2 flex-wrap">
                  {['Contacted', 'Interested', 'Agreement Sent', 'Agreement Signed', 'Sent to Training', 'Sent to Marketing', 'Rejected'].map(status => (
                    <button key={status}
                      onClick={() => updateRecruitment.mutate({ status })}
                      className={`px-3 py-1 rounded-lg text-xs border transition-colors ${candidate.recruitment.status === status ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                      {status}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={candidate.recruitment.agreementSent}
                      onChange={e => updateRecruitment.mutate({ agreementSent: e.target.checked, agreementSentAt: new Date() })}
                      className="rounded" />
                    Mark Agreement Sent
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={candidate.recruitment.agreementSigned}
                      onChange={e => updateRecruitment.mutate({ agreementSigned: e.target.checked, agreementSignedAt: new Date() })}
                      className="rounded" />
                    Mark Agreement Signed
                  </label>
                </div>
              </div>
            ) : <p className="text-gray-400">No recruitment record found</p>}
          </div>
        )}

        {activeTab === 'Training' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Training Details</h3>
            {candidate.training ? (
              <div className="space-y-3">
                <InfoRow label="Status" value={candidate.training.status} />
                <InfoRow label="Trainer" value={candidate.training.trainer?.name} />
                <InfoRow label="Technical Rating" value={candidate.training.technicalRating ? `${candidate.training.technicalRating}/5` : null} />
                <InfoRow label="Communication" value={candidate.training.communicationRating ? `${candidate.training.communicationRating}/5` : null} />
                <InfoRow label="Confidence" value={candidate.training.confidenceRating ? `${candidate.training.confidenceRating}/5` : null} />
                {candidate.training.trainerFeedback && (
                  <div>
                    <span className="text-gray-500 text-sm">Trainer Feedback</span>
                    <p className="text-sm text-gray-900 mt-1">{candidate.training.trainerFeedback}</p>
                  </div>
                )}
                <div className="pt-2 flex gap-2 flex-wrap">
                  {['Evaluation', 'Training', 'Interview Prep', 'Mock Interview Scheduled', 'Ready for Marketing'].map(status => (
                    <button key={status}
                      onClick={() => updateTraining.mutate({ status })}
                      className={`px-3 py-1 rounded-lg text-xs border transition-colors ${candidate.training.status === status ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'}`}>
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ) : <p className="text-gray-400">Not yet assigned to training</p>}
          </div>
        )}

        {activeTab === 'Interviews' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Interview History</h3>
            {candidate.interviews?.length ? candidate.interviews.map(i => (
              <div key={i.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{i.type} — {i.clientName}</span>
                  <Badge text={i.status} className="bg-blue-100 text-blue-700" />
                </div>
                <div className="text-gray-500 mt-1">{i.jobTitle} • {i.scheduledAt ? new Date(i.scheduledAt).toLocaleString() : ''}</div>
                {i.feedback && <div className="mt-1 text-gray-600">{i.feedback}</div>}
              </div>
            )) : <p className="text-gray-400">No interviews yet</p>}
          </div>
        )}

        {activeTab === 'Placement' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Placement Details</h3>
            {candidate.placement ? (
              <div className="space-y-2">
                <InfoRow label="Client" value={candidate.placement.clientName} />
                <InfoRow label="Vendor" value={candidate.placement.vendorName} />
                <InfoRow label="Job Title" value={candidate.placement.jobTitle} />
                <InfoRow label="Status" value={candidate.placement.status} />
                <InfoRow label="Type" value={candidate.placement.placementType} />
                <InfoRow label="Pay Rate" value={candidate.placement.payRate ? `$${candidate.placement.payRate}/hr` : null} />
                <InfoRow label="Bill Rate" value={candidate.placement.billRate ? `$${candidate.placement.billRate}/hr` : null} />
                <InfoRow label="Margin" value={candidate.placement.margin ? `$${candidate.placement.margin}` : null} />
                <InfoRow label="Start Date" value={candidate.placement.startDate ? new Date(candidate.placement.startDate).toLocaleDateString() : null} />
              </div>
            ) : <p className="text-gray-400">Not yet placed</p>}
          </div>
        )}

        {activeTab === 'Payments' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Subscription & Payments</h3>
            {candidate.subscriptions?.length ? candidate.subscriptions.map(s => (
              <div key={s.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.plan?.name}</span>
                  <Badge text={s.status} className={s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} />
                </div>
                <div className="text-gray-500 mt-1">${s.plan?.amount}/{s.plan?.interval} • Next: {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : '—'}</div>
              </div>
            )) : <p className="text-gray-400">No subscriptions</p>}
            <h4 className="font-medium text-gray-800 pt-2">Payment History</h4>
            {candidate.payments?.length ? candidate.payments.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm border-b border-gray-100 py-2">
                <span className="text-gray-600">{new Date(p.createdAt).toLocaleDateString()}</span>
                <span className={p.status === 'succeeded' ? 'text-green-600' : 'text-red-600'}>${p.amount} — {p.status}</span>
                {p.invoiceUrl && <a href={p.invoiceUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-xs">Invoice</a>}
              </div>
            )) : <p className="text-gray-400 text-sm">No payments</p>}
          </div>
        )}

        {activeTab === 'Timeline' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Activity Timeline</h3>
            <div className="space-y-2">
              {candidate.activities?.map(a => (
                <div key={a.id} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <div className="w-px flex-1 bg-gray-200 my-1" />
                  </div>
                  <div className="pb-3">
                    <div className="font-medium text-gray-800">{a.action}</div>
                    {a.detail && <div className="text-gray-500 text-xs mt-0.5">{a.detail}</div>}
                    <div className="text-gray-400 text-xs mt-0.5">
                      {a.user?.name || 'System'} • {new Date(a.createdAt).toLocaleString()} • {a.module}
                    </div>
                  </div>
                </div>
              ))}
              {!candidate.activities?.length && <p className="text-gray-400">No activity recorded</p>}
            </div>
          </div>
        )}
      </div>

      {/* Add Note */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Add Note</h3>
        <div className="flex gap-3">
          <select value={noteModule} onChange={e => setNoteModule(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {['general', 'recruitment', 'training', 'marketing'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => noteMutation.mutate({ content: note, module: noteModule })}
            disabled={!note.trim() || noteMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50">
            Add
          </button>
        </div>
        {candidate.notes?.length > 0 && (
          <div className="mt-4 space-y-2">
            {candidate.notes.map(n => (
              <div key={n.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700">{n.author?.name}</span>
                  <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()} • {n.module}</span>
                </div>
                <p className="text-gray-700">{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
