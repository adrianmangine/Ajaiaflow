import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocument, updateDocument, registerPresence, getPresence, leavePresence, getVersions, saveVersion } from '../api';
import { useAuth } from '../hooks/useAuth';
import Editor from '../components/Editor';
import ShareModal from '../components/ShareModal';

const AUTOSAVE_DELAY = 1500;
const PRESENCE_INTERVAL = 8000;
const AVATAR_COLORS = ['#c4622d', '#2d5c9c', '#2d7a4f', '#8e44ad', '#c0392b'];

function AvatarBubble({ username, index }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div className="avatar-bubble" style={{ background: color }} title={username + ' is viewing'}>
      {username[0].toUpperCase()}
    </div>
  );
}

function VersionSidebar({ docId, onClose, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    getVersions(docId).then(v => { setVersions(v); setLoading(false); });
  }, [docId]);

  const formatDate = (iso) => new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });

  return (
    <div className="version-sidebar">
      <div className="version-sidebar-header">
        <h3>Version History</h3>
        <button className="btn-icon" onClick={onClose}>&times;</button>
      </div>
      {loading ? (
        <div className="version-loading">Loading...</div>
      ) : versions.length === 0 ? (
        <div className="version-empty">No versions yet. A version is saved each time you leave a document.</div>
      ) : (
        <div className="version-list">
          {versions.map((v, i) => (
            <div
              key={v.id}
              className={'version-item' + (preview && preview.id === v.id ? ' active' : '')}
              onClick={() => setPreview(v)}
            >
              <div className="version-meta">
                <span className="version-label">Session {versions.length - i}</span>
                <span className="version-date">{formatDate(v.savedAt)}</span>
              </div>
              <span className="version-by">by @{v.savedBy}</span>
              {preview && preview.id === v.id && (
                <button
                  className="btn-small btn-restore"
                  onClick={(e) => { e.stopPropagation(); onRestore(v.content); }}
                >
                  Restore this version
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {preview && (
        <div className="version-preview">
          <p className="version-preview-label">Preview</p>
          <div className="version-preview-content" dangerouslySetInnerHTML={{ __html: preview.content }} />
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState('saved');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [viewers, setViewers] = useState([]);

  const saveTimer = useRef(null);
  const latestContent = useRef('');

  const fetchDoc = useCallback(async () => {
    try {
      const data = await getDocument(id);
      setDoc(data);
      setTitleValue(data.title);
      latestContent.current = data.content;
    } catch (err) {
      setError(err.response && err.response.status === 403
        ? "You don't have access to this document."
        : 'Document not found.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDoc(); }, [fetchDoc]);

  useEffect(() => {
    if (!doc) return;
    registerPresence(id).catch(() => {});

    const pollPresence = async () => {
      try {
        const active = await getPresence(id);
        setViewers(active.filter(v => v.userId !== (user && user.id)));
      } catch {}
    };

    pollPresence();
    const heartbeat = setInterval(() => registerPresence(id).catch(() => {}), PRESENCE_INTERVAL);
    const poll = setInterval(pollPresence, PRESENCE_INTERVAL);

    return () => {
      clearInterval(heartbeat);
      clearInterval(poll);
      leavePresence(id).catch(() => {});
    };
  }, [doc, id, user]);

  useEffect(() => {
    return () => { saveVersion(id).catch(() => {}); };
  }, [id]);

  const handleContentChange = useCallback((html) => {
    latestContent.current = html;
    setSaveState('unsaved');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState('saving');
      try {
        await updateDocument(id, { content: latestContent.current });
        setSaveState('saved');
      } catch {
        setSaveState('unsaved');
      }
    }, AUTOSAVE_DELAY);
  }, [id]);

  const handleTitleSave = async () => {
    if (!titleValue.trim()) return;
    setEditingTitle(false);
    try {
      await updateDocument(id, { title: titleValue.trim() });
      setDoc(prev => ({ ...prev, title: titleValue.trim() }));
    } catch {
      setTitleValue(doc.title);
    }
  };

  const handleRestoreVersion = async (content) => {
    try {
      await updateDocument(id, { content });
      setDoc(prev => ({ ...prev, content }));
      latestContent.current = content;
      setShowVersions(false);
      setSaveState('saved');
    } catch {}
  };

  const isOwner = doc && doc.ownerId === (user && user.id);

  const saveLabels = { saved: 'Saved', saving: 'Saving...', unsaved: 'Unsaved' };
  const saveLabel = saveLabels[saveState];

  if (loading) return <div className="editor-loading">Loading document...</div>;
  if (error) return (
    <div className="editor-error">
      <p>{error}</p>
      <button className="btn-primary" onClick={() => navigate('/')}>Back to dashboard</button>
    </div>
  );

  return (
    <div className="editor-page">
      <header className="editor-header">
        <div className="header-left">
          <button className="btn-ghost back-btn" onClick={() => navigate('/')}>
            &larr; AjaiaFlow
          </button>
          <div className="title-area">
            {editingTitle ? (
              <input
                autoFocus
                className="title-input"
                value={titleValue}
                onChange={e => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(doc.title); }
                }}
              />
            ) : (
              <h1
                className="doc-title"
                onClick={() => isOwner && setEditingTitle(true)}
                title={isOwner ? 'Click to rename' : ''}
              >
                {doc && doc.title}
                {isOwner && <span className="edit-hint">&#9998;</span>}
              </h1>
            )}
            <span className={'save-status save-' + saveState}>{saveLabel}</span>
          </div>
        </div>
        <div className="header-right">
          {viewers.length > 0 && (
            <div className="presence-area">
              {viewers.map((v, i) => <AvatarBubble key={v.userId} username={v.username} index={i} />)}
            </div>
          )}
          <span className={'role-badge ' + (isOwner ? 'badge-owner' : 'badge-shared')}>
            {isOwner ? 'Owner' : ('Shared by ' + (doc && doc.ownerUsername))}
          </span>
          <button className="btn-outline" onClick={() => setShowVersions(v => !v)}>History</button>
          {isOwner && <button className="btn-primary" onClick={() => setShowShare(true)}>Share</button>}
        </div>
      </header>

      <div className={'editor-body' + (showVersions ? ' with-sidebar' : '')}>
        <div className="editor-page-container">
          <Editor content={doc && doc.content} onChange={handleContentChange} readOnly={false} />
        </div>
        {showVersions && (
          <VersionSidebar
            docId={id}
            onClose={() => setShowVersions(false)}
            onRestore={handleRestoreVersion}
          />
        )}
      </div>

      {showShare && (
        <ShareModal doc={doc} onClose={() => setShowShare(false)} onUpdate={fetchDoc} />
      )}
    </div>
  );
}
