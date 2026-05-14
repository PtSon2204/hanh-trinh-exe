import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import authApi from '../api/authApi';
import '../styles/auth.css';

// ── Icons ────────────────────────────────────────────────────────────
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.49 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.41 1.1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.43a16 16 0 0 0 5.66 5.66l1.79-1.79a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

type Tab = 'profile' | 'password';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // ── Profile form state ──────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName ?? '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Change password state ───────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Redirect if not authenticated ───────────────────────────────
  if (!user) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:'1rem', fontFamily:'Outfit,sans-serif' }}>
        <p style={{ fontSize:'1.125rem', color:'#64748b' }}>Bạn cần đăng nhập để xem trang này.</p>
        <Link to="/login" style={{ color:'#4f46e5', fontWeight:700, textDecoration:'none' }}>Đăng nhập ngay</Link>
      </div>
    );
  }

  // ── Handlers ────────────────────────────────────────────────────
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null); setProfileLoading(true);
    try {
      await axiosClientPut('/profile', { fullName: profileForm.fullName, phone: profileForm.phone || undefined });
      setProfileMsg({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      toast.success('Đã lưu thông tin!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Cập nhật thất bại.';
      setProfileMsg({ type: 'error', text: msg });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ type:'error', text:'Mật khẩu mới không khớp.' }); return; }
    if (pwForm.next.length < 6) { setPwMsg({ type:'error', text:'Mật khẩu mới phải ít nhất 6 ký tự.' }); return; }
    setPwLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
        confirmNewPassword: pwForm.confirm,
      });
      setPwMsg({ type:'success', text:'Đổi mật khẩu thành công!' });
      setPwForm({ current:'', next:'', confirm:'' });
      toast.success('Mật khẩu đã được cập nhật!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Đổi mật khẩu thất bại.';
      setPwMsg({ type:'error', text: msg });
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    toast.success('Đã đăng xuất!');
    navigate('/login');
  };

  // Avatar initials
  const initials = user.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Outfit,sans-serif' }}>
      {/* Top nav bar */}
      <nav style={{
        background:'white', borderBottom:'1px solid #e2e8f0',
        padding:'0 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px',
        position:'sticky', top:0, zIndex:100,
        boxShadow:'0 1px 3px rgba(0,0,0,.06)',
      }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:'.5rem', textDecoration:'none' }}>
          <div style={{
            width:'36px', height:'36px', borderRadius:'10px',
            background:'linear-gradient(135deg,#3b82f6,#6366f1)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9h1.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
            </svg>
          </div>
          <span style={{ fontWeight:800, fontSize:'1.0625rem', color:'#0f172a', letterSpacing:'-.02em' }}>
            ALMA<span style={{ color:'#3b82f6' }}>.</span>
          </span>
        </Link>

        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <span style={{ fontSize:'.875rem', color:'#64748b' }}>Xin chào, <strong style={{ color:'#1e293b' }}>{user.fullName}</strong></span>
          <button
            id="profile-logout"
            onClick={handleLogout}
            style={{
              display:'flex', alignItems:'center', gap:'.375rem',
              padding:'.5rem 1rem', borderRadius:'.625rem',
              border:'1.5px solid #e2e8f0', background:'white',
              cursor:'pointer', fontFamily:'Outfit,sans-serif', fontSize:'.8125rem', fontWeight:600, color:'#64748b',
              transition:'all .2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='#ef4444'; (e.currentTarget as HTMLButtonElement).style.color='#ef4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.color='#64748b'; }}
          >
            <LogoutIcon /> Đăng xuất
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth:'720px', margin:'0 auto', padding:'2rem 1.5rem' }}>
        {/* Header */}
        <div style={{
          background:'linear-gradient(135deg,#0f172a,#1e293b,#312e81)',
          borderRadius:'1.5rem', padding:'2rem', marginBottom:'1.5rem',
          display:'flex', alignItems:'center', gap:'1.5rem', position:'relative', overflow:'hidden',
        }}>
          <div style={{
            position:'absolute', top:'-40px', right:'-40px',
            width:'200px', height:'200px', background:'rgba(99,102,241,.2)',
            borderRadius:'50%', filter:'blur(40px)',
          }} />
          {/* Avatar */}
          <div style={{
            width:'72px', height:'72px', borderRadius:'50%',
            background:'linear-gradient(135deg,#3b82f6,#6366f1)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.5rem', fontWeight:800, color:'white',
            border:'3px solid rgba(255,255,255,.2)',
            flexShrink:0,
          }}>{initials}</div>
          <div>
            <h1 style={{ fontSize:'1.375rem', fontWeight:800, color:'white', marginBottom:'.25rem' }}>{user.fullName}</h1>
            <p style={{ fontSize:'.875rem', color:'#94a3b8' }}>{user.email}</p>
            <span style={{
              display:'inline-block', marginTop:'.5rem',
              padding:'.2rem .625rem', borderRadius:'999px',
              background:'rgba(99,102,241,.3)', color:'#a5b4fc',
              fontSize:'.6875rem', fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase',
            }}>{user.role}</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display:'flex', borderRadius:'1rem', background:'white',
          border:'1px solid #e2e8f0', marginBottom:'1.5rem', padding:'.25rem',
        }}>
          {(['profile', 'password'] as Tab[]).map(tab => (
            <button
              key={tab}
              id={`profile-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              style={{
                flex:1, padding:'.625rem 1rem', borderRadius:'.75rem', border:'none', cursor:'pointer',
                fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:'.875rem', transition:'all .2s',
                background: activeTab === tab ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'transparent',
                color: activeTab === tab ? 'white' : '#64748b',
                boxShadow: activeTab === tab ? '0 4px 12px -4px rgba(79,70,229,.4)' : 'none',
              }}
            >
              {tab === 'profile' ? '👤 Thông tin cá nhân' : '🔒 Đổi mật khẩu'}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ background:'white', borderRadius:'1.25rem', padding:'2rem', border:'1px solid #e2e8f0' }}>
            <h2 style={{ fontSize:'1.125rem', fontWeight:700, color:'#0f172a', marginBottom:'1.5rem' }}>Cập nhật thông tin</h2>

            {profileMsg && <div className={`alert alert--${profileMsg.type}`}>{profileMsg.text}</div>}

            <form onSubmit={handleProfileSave} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="form-group">
                <span className="form-icon"><UserIcon /></span>
                <input
                  id="profile-fullname"
                  className="form-input"
                  type="text"
                  placeholder="Họ và tên"
                  value={profileForm.fullName}
                  onChange={e => setProfileForm(p => ({ ...p, fullName: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <span className="form-icon"><PhoneIcon /></span>
                <input
                  id="profile-phone"
                  className="form-input"
                  type="tel"
                  placeholder="Số điện thoại"
                  value={profileForm.phone}
                  onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <button id="profile-save" type="submit" className="btn-primary" disabled={profileLoading} style={{ maxWidth:'200px' }}>
                {profileLoading ? <span className="spinner" /> : <><SaveIcon /><span>Lưu thay đổi</span></>}
              </button>
            </form>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div style={{ background:'white', borderRadius:'1.25rem', padding:'2rem', border:'1px solid #e2e8f0' }}>
            <h2 style={{ fontSize:'1.125rem', fontWeight:700, color:'#0f172a', marginBottom:'1.5rem' }}>Đổi mật khẩu</h2>

            {pwMsg && <div className={`alert alert--${pwMsg.type}`}>{pwMsg.text}</div>}

            <form onSubmit={handlePasswordChange} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {[
                { id:'pw-current', field:'current' as const, label:'Mật khẩu hiện tại', showKey:'current' as const },
                { id:'pw-new', field:'next' as const, label:'Mật khẩu mới', showKey:'next' as const },
                { id:'pw-confirm', field:'confirm' as const, label:'Xác nhận mật khẩu mới', showKey:'confirm' as const },
              ].map(({ id, field, label, showKey }) => (
                <div className="form-group" key={field}>
                  <span className="form-icon"><LockIcon /></span>
                  <input
                    id={id}
                    className="form-input form-input--pr"
                    type={showPw[showKey] ? 'text' : 'password'}
                    placeholder={label}
                    value={pwForm[field]}
                    onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                    required
                    autoComplete={field === 'current' ? 'current-password' : 'new-password'}
                  />
                  <span className="form-input-action">
                    <button type="button" className="toggle-pw" onClick={() => setShowPw(p => ({ ...p, [showKey]: !p[showKey] }))}>
                      {showPw[showKey] ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </span>
                </div>
              ))}

              <button id="pw-submit" type="submit" className="btn-primary" disabled={pwLoading} style={{ maxWidth:'240px' }}>
                {pwLoading ? <span className="spinner" /> : <><LockIcon /><span>Cập nhật mật khẩu</span></>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Internal axios helper (re-uses axiosClient) ────────────────────
import axiosClient from '../../../shared/api/axiosClient';

function axiosClientPut(url: string, data: unknown) {
  return axiosClient.put(url, data);
}
