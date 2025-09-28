
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function TicketsDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const fetchTickets = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tickets`, {
          headers: { Authorization: `Bearer ${token}` },
          method: "GET",
        });
        
        const data = await res.json();
        setTickets(data.tickets || []);
      } catch (err) {
        console.error("Failed to fetch tickets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'done': return '#22c55e';
      case 'in_progress': return '#3b82f6';
      case 'todo': return '#eab308';
      default: return '#6b7280';
    }
  };

  const getPriorityEmoji = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const handleDeleteTicket = async (ticketId, e) => {
    e.preventDefault(); // Prevent navigation to ticket details
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }
    
    setDeleting(ticketId);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        // Remove ticket from local state
        setTickets(tickets.filter(ticket => ticket._id !== ticketId));
        console.log('Ticket deleted successfully');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete ticket');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket: ' + error.message);
    } finally {
      setDeleting(null);
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
              TicketFlow Dashboard
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              Welcome, {user?.email?.split('@')[0] || 'User'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link 
              to="/ticket"
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
              + New
            </Link>
            {user?.role === 'admin' && (
              <Link 
                to="/admin"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #dc2626, #ef4444, #f87171)',
                  backgroundSize: '200% 200%',
                  color: 'white',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  boxShadow: '0 1px 4px rgba(220, 38, 38, 0.4)',
                  border: 'none'
                }}
              >
                🛡️ Admin
              </Link>
            )}
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

        {/* Ultra Compact Stats Row */}
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
              {tickets.length}
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
              {tickets.filter(t => t.status?.toLowerCase() !== 'done').length}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Open</p>
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
              {tickets.filter(t => ['high', 'urgent'].includes(t.priority?.toLowerCase())).length}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Urgent</p>
          </div>
        </div>

        {/* Ultra Compact Tickets List */}
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
              Your Tickets
            </h2>
            <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
              {tickets.length} total
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
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#94a3b8'
            }}>

              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', color: '#e2e8f0' }}>
                No tickets yet
              </h3>
              <p style={{ marginBottom: '1.5rem' }}>
                Create your first support ticket to get started
              </p>
              <Link 
                to="/ticket"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  display: 'inline-block'
                }}
              >
                Create First Ticket
              </Link>
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
              {tickets.map((ticket) => (
                <Link
                  key={ticket._id}
                  to={`/ticket/${ticket._id}`}
                  style={{
                    display: 'block',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0.75rem',
                    textDecoration: 'none',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.375rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '0.125rem'
                      }}>
                        {ticket.title}
                      </h3>
                      <p style={{
                        color: '#cbd5e1',
                        fontSize: '0.75rem',
                        lineHeight: '1.2',
                        marginBottom: '0.375rem'
                      }}>
                        {ticket.description?.length > 60 
                          ? ticket.description.substring(0, 60) + '...' 
                          : ticket.description}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem', alignItems: 'center' }}>
                      {ticket.priority && (
                        <span style={{
                          backgroundColor: getPriorityColor(ticket.priority),
                          color: 'white',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '8px',
                          fontSize: '0.65rem',
                          fontWeight: '600'
                        }}>
                          {getPriorityEmoji(ticket.priority)}
                        </span>
                      )}
                      {ticket.status && (
                        <span style={{
                          backgroundColor: getStatusColor(ticket.status),
                          color: 'white',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '8px',
                          fontSize: '0.65rem',
                          fontWeight: '600'
                        }}>
                          {ticket.status === 'IN_PROGRESS' ? 'PROG' : ticket.status}
                        </span>
                      )}
                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteTicket(ticket._id, e)}
                        disabled={deleting === ticket._id}
                        style={{
                          background: deleting === ticket._id ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          padding: '0.125rem 0.25rem',
                          color: '#fca5a5',
                          fontSize: '0.6rem',
                          cursor: deleting === ticket._id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {deleting === ticket._id ? '...' : '🗑️'}
                      </button>
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
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                    {ticket.category && (
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '6px',
                        fontSize: '0.6rem'
                      }}>
                        {ticket.category}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
