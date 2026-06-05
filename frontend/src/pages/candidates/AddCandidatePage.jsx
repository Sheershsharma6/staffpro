import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api';

export default function AddCandidatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', country: 'USA',
    location: '', technology: '', yearsOfExperience: '', source: 'manual',
    workAuthorization: '', linkedinUrl: ''
  });
  const [resume, setResume] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((files) => setResume(files[0]), []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] }, maxFiles: 1
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const candidate = await api.post('/candidates', data).then(r => r.data);
      if (resume) {
        const fd = new FormData();
        fd.append('resume', resume);
        const parsed = await api.post(`/candidates/${candidate.id}/resume`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(r => r.data);
        if (parsed.parsedData) setParsedData(parsed.parsedData);
      }
      return candidate;
    },
    onSuccess: (c) => navigate(`/candidates/${c.id}`),
    onError: (err) => setError(err.response?.data?.error || 'Failed to create candidate')
  });

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => { e.preventDefault(); setError(''); createMutation.mutate(form); };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Candidate</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in candidate details or upload a resume to auto-fill</p>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {/* Resume Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Resume Upload (Optional)</h3>
        <div {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}>
          <input {...getInputProps()} />
          <div className="text-4xl mb-2">📄</div>
          {resume ? (
            <p className="text-sm text-green-600 font-medium">{resume.name}</p>
          ) : (
            <p className="text-sm text-gray-500">Drag & drop resume (PDF) or click to select</p>
          )}
        </div>
        {parsedData && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm text-green-700">
            ✓ Resume parsed — found: {parsedData.skills?.slice(0,5).join(', ')}
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">Candidate Information</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'firstName', label: 'First Name', required: true },
            { name: 'lastName', label: 'Last Name', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Phone' },
          ].map(({ name, label, type = 'text', required }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
              <input type={type} name={name} value={form[name]} onChange={handleChange} required={required}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
            <select name="country" value={form.country} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="USA">USA</option>
              <option value="UK">UK</option>
              <option value="CANADA">Canada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select name="source" value={form.source} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {['manual', 'linkedin', 'referral', 'job_board', 'upload'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Technology</label>
            <input name="technology" value={form.technology} onChange={handleChange} placeholder="e.g. React, Java, Salesforce"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
            <input type="number" name="yearsOfExperience" value={form.yearsOfExperience} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Authorization</label>
            <input name="workAuthorization" value={form.workAuthorization} onChange={handleChange} placeholder="e.g. H1B, OPT, GC, Citizen"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input name="location" value={form.location} onChange={handleChange} placeholder="City, State"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={createMutation.isPending}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : 'Create Candidate'}
          </button>
        </div>
      </form>
    </div>
  );
}
