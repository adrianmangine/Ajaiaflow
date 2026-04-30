import { useState } from 'react';
import { shareDocument, revokeAccess } from '../api';

export default function ShareModal({ doc, onClose, onUpdate }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleShare = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await shareDocument(doc.id, username.trim());
      setSuccess('Shared with ' + username.trim());
      setUsername('');
      onUpdate && onUpdate();
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.error) || 'Failed to share');
    } finally { setLoading(false); }
  };

  const handleRevoke = async (userId, uname) => {
    if (!confirm('Remove ' + uname + "'s access?")) return;
    try { await revokeAccess(doc.id, userId); setSuccess('Removed ' + uname + "'s access"); onUpdate && onUpdate(); }
    catch (err) { setError((err.response && err.response.data && err.response.data.error) || 'Failed to revoke'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share "{doc.title}"</h3>
          <button className="btn-icon" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleShare} className="share-form">
          <input type="text" placeholder="Enter username (alice, bob, charlie)" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          <button type="submit" className="btn-primary" disabled={loading || !username.trim()}>{loading ? '...' : 'Share'}</button>
        </form>
        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}
        {doc.shares && doc.shares.length > 0 ? (
          <div className="share-list">
            <p className="share-list-label">Currently shared with:</p>
            {doc.shares.map(s => (
              <div key={s.userId} className="share-item">
                <span className="share-username">@{s.username}</span>
                <button className="btn-small btn-danger" onClick={() => handleRevoke(s.userId, s.username)}>Remove</button>
              </div>
            ))}
          </div>
        ) : <p className="share-empty">Not shared with anyone yet.</p>}
      </div>
    </div>
  );
}
