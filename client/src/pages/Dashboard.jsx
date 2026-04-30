import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, createDocument, deleteDocument, uploadFile } from '../api';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState({ owned: [], shared: [] });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef();

  const fetchDocs = async () => {
    try { const data = await getDocuments(); setDocs(data); }
    catch { setError('Failed to load documents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try { const doc = await createDocument(newTitle.trim()); setNewTitle(''); setCreating(false); navigate(`/editor/${doc.id}`); }
    catch { setError('Failed to create document'); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this document?')) return;
    try { await deleteDocument(id); setDocs(prev => ({ ...prev, owned: prev.owned.filter(d => d.id !== id) })); }
    catch { setError('Failed to delete document'); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try { const { document: doc } = await uploadFile(file); navigate(`/editor/${doc.id}`); }
    catch (err) { setUploadError(err.response?.data?.error || 'Upload failed. Accepted: .txt, .md'); }
    e.target.value = '';
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const DocCard = ({ doc, isOwned }) => (
    <div className="doc-card" onClick={() => navigate(`/editor/${doc.id}`)}>
      <div className="doc-card-icon">{isOwned ? '\u{1F4C4}' : '\u{1F517}'}</div>
      <div className="doc-card-body">
        <h3>{doc.title}</h3>
        <p className="doc-meta">{isOwned ? `Updated ${formatDate(doc.updatedAt)}` : `Shared by ${doc.sharedBy} \u00B7 ${formatDate(doc.updatedAt)}`}</p>
      </div>
      <div className="doc-card-actions">
        <span className={`doc-badge ${isOwned ? 'badge-owner' : 'badge-shared'}`}>{isOwned ? 'Owner' : 'Shared'}</span>
        {isOwned && <button className="btn-icon btn-danger" onClick={(e) => handleDelete(doc.id, e)} title="Delete">&times;</button>}
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left"><div className="logo-mark small">A</div><span className="app-name">AjaiaFlow</span></div>
        <div className="header-right"><span className="username-label">@{user?.username}</span><button className="btn-ghost" onClick={logoutUser}>Sign out</button></div>
      </header>
      <main className="dashboard-main">
        <div className="dashboard-toolbar">
          <h2>My Documents</h2>
          <div className="toolbar-actions">
            {uploadError && <span className="upload-error">{uploadError}</span>}
            <button className="btn-outline" onClick={() => fileInputRef.current?.click()}>Import file</button>
            <input type="file" accept=".txt,.md" ref={fileInputRef} onChange={handleUpload} style={{ display: 'none' }} />
            <button className="btn-primary" onClick={() => setCreating(true)}>+ New document</button>
          </div>
        </div>
        {creating && (
          <form className="new-doc-form" onSubmit={handleCreate}>
            <input autoFocus type="text" placeholder="Document title..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className="new-doc-input" />
            <button type="submit" className="btn-primary" disabled={!newTitle.trim()}>Create</button>
            <button type="button" className="btn-ghost" onClick={() => { setCreating(false); setNewTitle(''); }}>Cancel</button>
          </form>
        )}
        {error && <p className="error-msg">{error}</p>}
        {loading ? <div className="loading-state">Loading documents...</div> : (
          docs.owned.length === 0 && docs.shared.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" style={{fontSize: '48px', marginBottom: '16px'}}>&#128221;</div>
              <h3>No documents yet</h3>
              <p>Create your first document or import a .txt / .md file</p>
            </div>
          ) : (
            <>
              {docs.owned.length > 0 && (
                <section className="doc-section">
                  <h4 className="section-label">Owned by me</h4>
                  <div className="doc-list">{docs.owned.map(doc => <DocCard key={doc.id} doc={doc} isOwned />)}</div>
                </section>
              )}
              {docs.shared.length > 0 && (
                <section className="doc-section">
                  <h4 className="section-label">Shared with me</h4>
                  <div className="doc-list">{docs.shared.map(doc => <DocCard key={doc.id} doc={doc} isOwned={false} />)}</div>
                </section>
              )}
            </>
          )
        )}
      </main>
    </div>
  );
}
