import React, { useEffect, useState } from 'react';
import { Mail, Send, Users, CheckCircle2, AlertCircle, RefreshCw, Clock, ChevronRight } from 'lucide-react';
import { adminService } from '../../services/admin.service';

type Audience = 'all' | 'campus' | 'verified' | 'unverified';
type Campaign = { id: string; title: string; subject: string; audience: Audience; campus?: string; totalRecipients: number; sentCount: number; failedCount: number; status: string; createdAt: string };

const campuses = ['UC Main', 'UC Banilad', 'UC LM', 'UC METC', 'UC PRI', 'UC Pardo-Talisay', 'UC South Campus', 'UC Medical Center'];

export const AdminEmailCampaigns: React.FC = () => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [campus, setCampus] = useState('UC Main');
  const [audienceCount, setAudienceCount] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sendingId, setSendingId] = useState('');
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCampaigns = async () => {
    try { setCampaigns(await adminService.getEmailCampaigns()); }
    catch (err: any) { setError(err?.message || 'Could not load campaign history.'); }
  };

  useEffect(() => { void loadCampaigns(); }, []);
  useEffect(() => {
    let active = true;
    adminService.getEmailAudience({ audience, campus: audience === 'campus' ? campus : undefined })
      .then((result) => { if (active) setAudienceCount(result.count || 0); })
      .catch(() => { if (active) setAudienceCount(0); });
    return () => { active = false; };
  }, [audience, campus]);

  const processCampaign = async (campaignId: string, initial?: { totalRecipients: number; sentCount?: number; failedCount?: number }) => {
    setSendingId(campaignId);
    setError('');
    setNotice('');
    let status = 'sending';
    let sent = initial?.sentCount || 0;
    let failed = initial?.failedCount || 0;
    const total = initial?.totalRecipients || 0;
    setProgress({ sent, failed, total });
    try {
      let idleBatches = 0;
      while (status === 'sending' && idleBatches < 20) {
        const result = await adminService.processEmailCampaignBatch(campaignId);
        status = result.status;
        sent = result.sentCount;
        failed = result.failedCount;
        setProgress({ sent, failed, total: result.totalRecipients || total });
        if (result.processed === 0 && status === 'sending') {
          idleBatches += 1;
          await new Promise((resolve) => setTimeout(resolve, 1200));
        } else {
          idleBatches = 0;
        }
      }
      if (status === 'sending') setNotice('Campaign is still queued. You can resume delivery from the campaign history.');
      else if (status === 'sent') setNotice(`Successfully sent to ${sent.toLocaleString()} students.`);
      else setNotice(`Delivery finished: ${sent.toLocaleString()} sent, ${failed.toLocaleString()} failed.`);
      await loadCampaigns();
    } catch (err: any) {
      setError(err?.message || 'Email delivery was interrupted. Resume it from campaign history.');
      await loadCampaigns();
    } finally {
      setSendingId('');
      setLoading(false);
    }
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (title.trim().length < 3 || subject.trim().length < 3 || message.trim().length < 10) {
      setError('Add a clear title, subject, and message before sending.');
      return;
    }
    if (!audienceCount) {
      setError('There are no eligible student email addresses in this audience.');
      return;
    }
    const confirmed = window.confirm(`Send this email to ${audienceCount.toLocaleString()} student accounts? This action cannot be undone.`);
    if (!confirmed) return;

    setLoading(true);
    setError('');
    setNotice('');
    try {
      const created = await adminService.createEmailCampaign({ title: title.trim(), subject: subject.trim(), message: message.trim(), audience, campus: audience === 'campus' ? campus : undefined });
      setTitle('');
      setSubject('');
      setMessage('');
      await loadCampaigns();
      await processCampaign(created.campaignId, { totalRecipients: created.totalRecipients });
    } catch (err: any) {
      setError(err?.message || 'Unable to create email campaign.');
      setLoading(false);
    }
  };

  return (
    <section className="admin-feature-stack">
      <div className="admin-feature-heading">
        <div>
          <span className="admin-eyebrow">DIRECT COMMUNICATION</span>
          <h2>Email students</h2>
          <p>Send important platform updates directly to real student accounts using the configured TradeLink email provider.</p>
        </div>
        <span className="admin-secure-label"><Mail size={14} /> Admin-only sending</span>
      </div>

      <div className="admin-email-layout">
        <form className="admin-panel-card admin-email-composer" onSubmit={handleSend}>
          <div className="admin-panel-heading">
            <div><h3>Compose update</h3><p>Write a clear message students can act on.</p></div>
            <div className="admin-composer-icon"><Mail size={20} /></div>
          </div>
          <label>Campaign title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="e.g. TradeLink marketplace improvements" required /></label>
          <label>Email subject<input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={200} placeholder="What students will see in their inbox" required /></label>
          <label>Who should receive this?
            <select value={audience} onChange={(event) => setAudience(event.target.value as Audience)}>
              <option value="all">All active student accounts</option>
              <option value="campus">Students from one campus</option>
              <option value="verified">Verified students only</option>
              <option value="unverified">Unverified students only</option>
            </select>
          </label>
          {audience === 'campus' && <label>Campus<select value={campus} onChange={(event) => setCampus(event.target.value)}>{campuses.map((item) => <option key={item}>{item}</option>)}</select></label>}
          <div className="admin-audience-preview"><Users size={17} /><div><strong>{audienceCount.toLocaleString()} recipients</strong><span>Live estimate from eligible student accounts</span></div><span className="admin-audience-dot" /></div>
          <label>Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={7} maxLength={5000} placeholder="Hello TradeLink community,&#10;&#10;We have an update to share..." required /></label>
          <div className="admin-compose-footer"><span>{message.length}/5,000 characters</span><button className="admin-primary-button" type="submit" disabled={loading || !audienceCount}><Send size={15} /> {loading ? 'Sending campaign…' : 'Send email update'}</button></div>
          {progress && sendingId && <div className="admin-delivery-progress"><div><span>Delivery progress</span><strong>{(progress.sent + progress.failed).toLocaleString()} / {progress.total.toLocaleString()}</strong></div><i><b style={{ width: `${progress.total ? (progress.sent + progress.failed) / progress.total * 100 : 0}%` }} /></i><small>{progress.sent.toLocaleString()} sent · {progress.failed.toLocaleString()} failed</small></div>}
          {error && <div className="admin-inline-error"><AlertCircle size={15} /> {error}</div>}
          {notice && <div className="admin-inline-success"><CheckCircle2 size={15} /> {notice}</div>}
        </form>

        <aside className="admin-panel-card admin-campaign-history">
          <div className="admin-panel-heading"><div><h3>Recent campaigns</h3><p>Delivery records and resumable queues.</p></div><button className="admin-icon-button" onClick={() => void loadCampaigns()} aria-label="Refresh campaigns"><RefreshCw size={16} /></button></div>
          {campaigns.length === 0 ? <div className="admin-empty-state"><Mail size={25} /><strong>No email campaigns yet</strong><span>Your sent updates will appear here.</span></div> : (
            <div className="admin-campaign-list">
              {campaigns.map((campaign) => (
                <article className="admin-campaign-item" key={campaign.id}>
                  <div className="admin-campaign-item-top"><span className={`admin-status-pill ${campaign.status}`}>{campaign.status}</span><small>{new Date(campaign.createdAt).toLocaleDateString()}</small></div>
                  <strong>{campaign.title}</strong><span className="admin-campaign-subject">{campaign.subject}</span>
                  <div className="admin-campaign-stats"><span>{campaign.sentCount.toLocaleString()} sent</span><span>{campaign.failedCount.toLocaleString()} failed</span><span>{campaign.totalRecipients.toLocaleString()} total</span></div>
                  {campaign.status === 'sending' && <button className="admin-resume-button" disabled={!!sendingId} onClick={() => void processCampaign(campaign.id, campaign)}><ChevronRight size={14} /> Resume delivery</button>}
                </article>
              ))}
            </div>
          )}
          <div className="admin-email-footnote"><Clock size={14} /> Large campaigns are sent in small batches. If delivery is interrupted, resume it here without duplicating already-sent emails.</div>
        </aside>
      </div>
    </section>
  );
};
