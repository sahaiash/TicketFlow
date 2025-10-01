import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ModeratorsPage() {
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {

    const fetchModerators = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tickets/moderators`, {
          headers: { Authorization: `Bearer ${token}` },
          method: "GET",
        });
        
        if (res.ok) {
          const data = await res.json();
          setModerators(data.moderators || []);
        } else {
          console.error("Failed to fetch moderators");
        }
      } catch (err) {
        console.error("Failed to fetch moderators:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchModerators();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return '#ef4444';
      case 'moderator': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getRoleEmoji = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return '🛡️';
      case 'moderator': return '👥';
      default: return '👤';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden',
      fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
      backgroundImage: 'linear-gradient(-45deg, #0f172a, #1e293b, #334155, #475569, #64748b)',
      backgroundSize: '400% 400%',
    }}>
      {/* Background Orbs */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent)',
          filter: 'blur(40px)',
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.15), transparent)',
          filter: 'blur(30px)',
        }}></div>
      </div>

      {/* Main Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        height: '100vh',
        overflow: 'visible',
        padding: '0.75rem'
      }}>
        {/* Ultra Compact Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '0.75rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #ffffff, #e2e8f0, #cbd5e1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.125rem'
            }}>
              Moderators & Admins
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              Team members who can manage tickets
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link 
              to="/dashboard"
              style={{
                backgroundImage: 'linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa)',
                backgroundSize: '200% 200%',
                color: 'white',
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.75rem',
                boxShadow: '0 1px 4px rgba(30, 64, 175, 0.4)',
                border: 'none'
              }}
            >
              ← Dashboard
            </Link>
            <button 
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                fontWeight: '500',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '0.75rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '0.5rem',
            flex: 1,
            textAlign: 'center'
          }}>
            <p style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.125rem' }}>
              {moderators.length}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Total</p>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '0.5rem',
            flex: 1,
            textAlign: 'center'
          }}>
            <p style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.125rem' }}>
              {moderators.filter(m => m.role === 'admin').length}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Admins</p>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '0.5rem',
            flex: 1,
            textAlign: 'center'
          }}>
            <p style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.125rem' }}>
              {moderators.filter(m => m.role === 'moderator').length}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Moderators</p>
          </div>
        </div>

        {/* Moderators List */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '0.75rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          height: 'calc(100vh - 180px)',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem'
          }}>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#e2e8f0'
            }}>
              Team Members
            </h2>
            <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
              {moderators.length} total
            </span>
          </div>

          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '3rem',
              color: '#94a3b8'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                borderTop: '3px solid white',
                borderRadius: '50%',
                marginRight: '1rem'
              }}></div>
              Loading moderators...
            </div>
          ) : moderators.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#94a3b8'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', color: '#e2e8f0' }}>
                No moderators found
              </h3>
              <p>
                There are no moderators or admins in the system yet
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.375rem',
              overflowY: 'auto',
              flex: 1,
              paddingRight: '1rem',
              paddingBottom: '2.5rem',
              scrollbarGutter: 'stable both-edges',
              scrollPaddingBottom: '2.5rem'
            }}>
              {moderators.map((moderator) => (
                <div
                  key={moderator._id}
                  style={{
                    display: 'block',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0.75rem',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.375rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '0.125rem'
                      }}>
                        {moderator.email}
                      </h3>
                      <p style={{
                        color: '#cbd5e1',
                        fontSize: '0.75rem',
                        lineHeight: '1.2'
                      }}>
                        {moderator.role === 'admin' ? 'System Administrator' : 'Ticket Moderator'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem', alignItems: 'center' }}>
                      <span style={{
                        backgroundColor: getRoleColor(moderator.role),
                        color: 'white',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '8px',
                        fontSize: '0.65rem',
                        fontWeight: '600'
                      }}>
                        {getRoleEmoji(moderator.role)} {moderator.role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#94a3b8',
                    fontSize: '0.65rem'
                  }}>
                    <span>
                      ID: {moderator._id.slice(-8)}
                    </span>
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '6px',
                      fontSize: '0.6rem'
                    }}>
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
