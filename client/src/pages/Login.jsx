import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { const { token, user } = await login(username, password); loginUser(token, user); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  const fillDemo = (name) => { setUsername(name); setPassword('password123'); setError(''); };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-mark">A</div>
          <h1>AjaiaFlow</h1>
          <p>Collaborative document editing</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field"><label>Username</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" required autoFocus /></div>
          <div className="field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required /></div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <div className="demo-accounts">
          <p className="demo-label">Demo accounts (password: password123)</p>
          <div className="demo-pills">{['alice', 'bob', 'charlie'].map(name => <button key={name} className="demo-pill" onClick={() => fillDemo(name)}>{name}</button>)}</div>
        </div>
      </div>
    </div>
  );
}
