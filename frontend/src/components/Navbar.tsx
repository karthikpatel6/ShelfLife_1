import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, PlusCircle, History, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          <div className="brand-icon">
            <BookOpen size={20} color="#fff" />
          </div>
          <span>ShelfLife</span>
        </NavLink>

        {isAuthenticated && (
          <div className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <BookOpen size={16} /> Catalog
            </NavLink>
            <NavLink to="/issue" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <PlusCircle size={16} /> Issue Book
            </NavLink>
            <NavLink to="/members/m1/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <History size={16} /> Member History
            </NavLink>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> {user?.name || 'Librarian'}
              </span>
              <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
