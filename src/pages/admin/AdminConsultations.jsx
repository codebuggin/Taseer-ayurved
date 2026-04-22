import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Clock, MessageCircle, Mail, Trash2, ShieldCheck, CheckSquare, RotateCcw } from 'lucide-react';

export default function AdminConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, pending, resolved

  useEffect(() => {
    fetchConsultations();
  }, []);

  async function fetchConsultations() {
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Consultations error:', error);
        setFetchError('Failed to load consultations. Check console or database permissions.');
      } else if (data) {
        setConsultations(data);
      }
    } catch (err) {
      console.error('Network error:', err);
      setFetchError('Unexpected error loading consultations.');
    } finally {
      setLoading(false);
    }
  }

  const updateStatus = async (id, newStatus) => {
    const isRead = newStatus !== 'pending';
    const { error } = await supabase
      .from('consultations')
      .update({ is_read: isRead, status: newStatus })
      .eq('id', id);
      
    if (!error) {
      setConsultations(prev => prev.map(c => c.id === id ? { ...c, is_read: isRead, status: newStatus } : c));
    } else {
      console.error('Update status error:', error);
    }
  };

  const deleteConsultation = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this consultation?")) return;
    const { error } = await supabase
      .from('consultations')
      .delete()
      .eq('id', id);

    if (!error) {
      setConsultations(prev => prev.filter(c => c.id !== id));
    } else {
      console.error('Delete error:', error);
      alert("Failed to delete. Ensure you ran the latest setup_consultations.sql");
    }
  };

  const parseMessage = (consultation) => {
    let concern = consultation.concern || null;
    let message = consultation.message || '';
    if (!concern && message.startsWith('[Concern:')) {
      const match = message.match(/^\[Concern:\s*(.*?)\]\s*(.*)$/si);
      if (match) {
          concern = match[1];
          message = match[2];
      }
    }
    return { concern, message };
  };

  const filteredConsultations = consultations.filter(c => {
    const isRead = c.is_read || (c.status && c.status !== 'pending');
    if (activeTab === 'pending') return !isRead;
    if (activeTab === 'resolved') return isRead;
    return true;
  });

  const getStatusBadge = (status) => {
    if (status === 'approved') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200"><ShieldCheck size={12} /> APPROVED</span>;
    if (status === 'cancelled') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide bg-rose-50 text-rose-700 border border-rose-200"><XCircle size={12} /> CANCELLED</span>;
    if (status === 'done' || status === 'resolved') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide bg-blue-50 text-blue-700 border border-blue-200"><CheckSquare size={12} /> DONE</span>;
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide bg-amber-50 text-amber-700 border border-amber-200"><Clock size={12} /> PENDING</span>;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-theme-bg-deep border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <h1 className="font-heading text-3xl text-theme-text-primary font-bold">Consultations</h1>
        
        <div className="flex bg-theme-bg-secondary p-1 rounded-xl border border-theme self-start">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-2 font-body text-[13px] font-medium rounded-lg transition-colors ${activeTab === 'all' ? 'bg-white shadow text-theme-bg-deep' : 'text-theme-text-muted hover:text-theme-text-primary'}`}>All</button>
          <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 font-body text-[13px] font-medium rounded-lg transition-colors ${activeTab === 'pending' ? 'bg-white shadow text-theme-bg-deep' : 'text-theme-text-muted hover:text-theme-text-primary'}`}>Pending</button>
          <button onClick={() => setActiveTab('resolved')} className={`px-4 py-2 font-body text-[13px] font-medium rounded-lg transition-colors ${activeTab === 'resolved' ? 'bg-white shadow text-theme-bg-deep' : 'text-theme-text-muted hover:text-theme-text-primary'}`}>Resolved</button>
        </div>
      </div>

      {fetchError ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-[16px] font-body flex items-center gap-3">
          <XCircle size={24} className="text-red-500" />
          <span>{fetchError}</span>
        </div>
      ) : (
        <div className="bg-white rounded-[16px] border border-theme shadow-sm overflow-hidden flex flex-col mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-[14px]">
              <thead className="bg-theme-bg-secondary text-theme-text-muted border-b border-theme">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Patient Details</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px]">Message</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px] text-center">Status</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[11px] text-right min-w-[280px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {filteredConsultations.map((consultation) => {
                  const isRead = consultation.is_read || (consultation.status && consultation.status !== 'pending');
                  const { concern, message } = parseMessage(consultation);
                  // Clean up phone number for WhatsApp link
                  const cleanPhone = consultation.phone ? consultation.phone.replace(/[^\d+]/g, '') : '';
                  const waNumber = cleanPhone.startsWith('+') ? cleanPhone : (cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`);

                  return (
                    <tr key={consultation.id} className="hover:bg-theme-bg-secondary/50 transition-colors">
                      <td className="px-6 py-4 align-top w-[25%]">
                        <div className="font-medium text-theme-text-primary">{consultation.name}</div>
                        <div className="text-[12px] font-mono text-theme-text-muted mt-1">{consultation.phone}</div>
                        {consultation.email && <div className="text-[12px] text-emerald-700 hover:underline"><a href={`mailto:${consultation.email}`}>{consultation.email}</a></div>}
                        <div className="text-[10px] text-theme-text-muted mt-2">{new Date(consultation.created_at).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 max-w-sm align-top">
                        {concern && <div className="inline-block px-2 py-1 bg-theme-bg-secondary border border-theme rounded-md text-[10px] font-bold text-theme-bg-deep uppercase mb-2">{concern}</div>}
                        <p className="text-theme-text-primary text-[13px] leading-relaxed break-words whitespace-pre-wrap">
                          {message}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center align-top w-[15%]">
                        {getStatusBadge(consultation.status)}
                      </td>
                      <td className="px-6 py-4 text-right align-top">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {!isRead && (
                            <div className="flex gap-1 mr-2">
                              <button onClick={() => updateStatus(consultation.id, 'approved')} className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors">Approved</button>
                              <button onClick={() => updateStatus(consultation.id, 'done')} className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 hover:bg-blue-100 transition-colors">Done</button>
                              <button onClick={() => updateStatus(consultation.id, 'cancelled')} className="px-2 py-1 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 hover:bg-rose-100 transition-colors">Cancel</button>
                            </div>
                          )}
                          {isRead && (
                            <button onClick={() => updateStatus(consultation.id, 'pending')} className="w-8 h-8 rounded-full bg-theme-bg-secondary border border-theme text-theme-text-muted flex items-center justify-center hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-colors title='Mark as Pending'" >
                              <RotateCcw size={14} />
                            </button>
                          )}
                          <div className="h-4 w-px bg-theme mx-1"></div>
                          {cleanPhone && (
                            <a 
                              href={`https://wa.me/${waNumber.replace('+', '')}?text=Hello ${consultation.name}, `} 
                              target="_blank" rel="noreferrer"
                              className="w-8 h-8 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors title='Reply on WhatsApp'"
                            >
                              <MessageCircle size={14} />
                            </a>
                          )}
                          {consultation.email && (
                            <a 
                              href={`mailto:${consultation.email}`}
                              className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors title='Send Email'"
                            >
                              <Mail size={14} />
                            </a>
                          )}
                          <button 
                            onClick={() => deleteConsultation(consultation.id)}
                            className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors title='Delete Consultation'"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredConsultations.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-theme-bg-secondary mb-3">
                        <CheckCircle className="text-theme-text-muted" size={24} />
                      </div>
                      <h3 className="font-heading font-semibold text-lg text-theme-text-primary mb-1">Inbox Empty</h3>
                      <p className="font-body text-sm text-theme-text-muted">No {activeTab !== 'all' ? activeTab : ''} consultations found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
