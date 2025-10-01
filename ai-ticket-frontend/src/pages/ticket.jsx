import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'

function CreateTicket() {
  const { id } = useParams();
  const isViewMode = Boolean(id); // If there's an ID, we're viewing a ticket
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: ''
  })
  const [ticketData, setTicketData] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [user, setUser] = useState(null);

  // Get user info from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Fetch ticket data if in view mode
  useEffect(() => {
    if (isViewMode) {
    const fetchTicket = async () => {
        setLoading(true);
      try {
        const token = localStorage.getItem("token");
          const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tickets/${id}`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          
          const data = await response.json();
          
          if (response.ok) {
            setTicketData(data.ticket);
        } else {
            setError("Failed to load ticket");
        }
      } catch (err) {
          setError("Failed to load ticket: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
    }
  }, [id, isViewMode]);

  // Fetch assignable users only if user is admin
  useEffect(() => {
    if (user && user.role === 'admin' && isViewMode) {
      const fetchAssignableUsers = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tickets/moderators`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setAssignableUsers(data.moderators || []);
          }
        } catch (err) {
          console.error("Failed to fetch assignable users:", err);
        }
      };

      fetchAssignableUsers();
    }
  }, [user, isViewMode]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (error) setError('');
    if (success) setSuccess('');
  }

  // Permissions: who can edit status?
  const canEditStatus = !!user && (
    user.role === 'admin' ||
    (user.role === 'moderator' && ticketData?.assignedTo?._id === user._id)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Client-side validation
    if (form.title.length < 5) {
      setError("Title must be at least 5 characters long");
      setLoading(false);
      return;
    }

    if (form.description.length < 10) {
      setError("Description must be at least 10 characters long");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess("Ticket created successfully!");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setError(data.error || data.message || "Failed to create ticket");
      }
    } catch (err) {
      setError("Failed to create ticket: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateTicket = async (updateData) => {
    setUpdating(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTicketData(data.ticket);
        setSuccess('Ticket updated successfully!');
      } else {
        setError(data.message || 'Failed to update ticket');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      setError('Failed to update ticket: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tickets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setSuccess('Ticket deleted successfully!');
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete ticket');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      setError('Failed to delete ticket: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
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
          top: '20%',
          left: '20%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent)',
          filter: 'blur(40px)',
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '20%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.2), transparent)',
          filter: 'blur(30px)',
        }}></div>
      </div>

      {/* Main Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '1rem',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '450px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          height: 'calc(100vh - 2rem)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Compact Header */}
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <Link 
              to="/dashboard" 
              style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #ffffff, #e2e8f0, #cbd5e1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textDecoration: 'none',
                marginBottom: '0.25rem',
                display: 'block'
              }}
            >
              TicketFlow
            </Link>
            <h2 style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              color: '#e2e8f0',
              marginBottom: '0.25rem'
            }}>
              {isViewMode ? 'Ticket Details' : 'Create New Ticket'}
            </h2>
            <p style={{
              color: '#94a3b8',
              fontSize: '0.8rem'
            }}>
              {isViewMode 
                ? (ticketData ? `Ticket #${id}` : 'Loading...')
                : 'Describe your issue briefly'
              }
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              padding: '0.75rem',
              marginBottom: '1.5rem',
              color: '#86efac',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '0.75rem',
              marginBottom: '1.5rem',
              color: '#fca5a5',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Ticket Details View */}
          {isViewMode && ticketData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '1rem'
                }}>
                  {ticketData.title}
                </h3>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {ticketData.priority && (
                    <span style={{
                      backgroundColor: ticketData.priority === 'urgent' ? '#ef4444' : 
                                     ticketData.priority === 'high' ? '#f97316' :
                                     ticketData.priority === 'medium' ? '#eab308' : '#22c55e',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {ticketData.priority}
                    </span>
                  )}
                  {ticketData.status && (
                    <span style={{
                      backgroundColor: ticketData.status === 'done' ? '#22c55e' :
                                     ticketData.status === 'in_progress' ? '#3b82f6' : '#eab308',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {ticketData.status.replace('_', ' ')}
                    </span>
                  )}
                  {ticketData.category && (
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {ticketData.category}
                    </span>
                  )}
                </div>

                <p style={{
                  color: '#cbd5e1',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  marginBottom: '1rem'
                }}>
                  {ticketData.description}
                </p>

                <div style={{
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '1rem'
                }}>
                  <p>Created: {new Date(ticketData.createdAt).toLocaleDateString()} at {new Date(ticketData.createdAt).toLocaleTimeString()}</p>
                  {ticketData.updatedAt && (
                    <p>Last updated: {new Date(ticketData.updatedAt).toLocaleDateString()} at {new Date(ticketData.updatedAt).toLocaleTimeString()}</p>
                  )}
                  {ticketData.assignedTo && (
                    <p>Assigned to: {ticketData.assignedTo.email}</p>
                  )}
                </div>
              </div>
              
              {/* Moderator/Admin Controls */}
              {user && (user.role === 'moderator' || user.role === 'admin') && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <h4 style={{ color: '#60a5fa', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                    {user?.role === 'admin' ? 'Admin Controls' : 'Moderator Controls'}
                  </h4>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <select
                      value={ticketData.status || ''}
                      onChange={(e) => handleUpdateTicket({ status: e.target.value })}
                      disabled={updating || !canEditStatus}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        fontSize: '0.8rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'white'
                      }}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                    
                    {/* Assignment dropdown - only for admins */}
                    {user && user.role === 'admin' && (
                      <select
                        value={ticketData.assignedTo?._id || ''}
                        onChange={(e) => handleUpdateTicket({ assignedTo: e.target.value || null })}
                        disabled={updating}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          fontSize: '0.8rem',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '6px',
                          color: 'white'
                        }}
                      >
                        <option value="">Unassigned</option>
                        {assignableUsers.map(assignUser => (
                          <option key={assignUser._id} value={assignUser._id}>
                            {assignUser.email}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {updating && (
                    <p style={{ color: '#60a5fa', fontSize: '0.8rem', textAlign: 'center' }}>
                      Updating...
                    </p>
                  )}
                </div>
              )}
              
              {/* Delete Button for Ticket Details */}
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={handleDeleteTicket}
                  disabled={deleting}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'white',
                    backgroundImage: deleting ? 'none' : 'linear-gradient(135deg, #dc2626, #ef4444, #f87171)',
                    backgroundColor: deleting ? 'rgba(239, 68, 68, 0.5)' : 'transparent',
                    backgroundSize: '200% 200%',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
                  }}
                >
                  {deleting ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                      }}></div>
                      Deleting...
                    </div>
                  ) : (
                    '🗑️ Delete Ticket'
                  )}
                </button>
              </div>
            </div>
          ) : isViewMode ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '3rem',
              color: '#94a3b8'
            }}>
              {loading ? (
                <>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '3px solid white',
                    borderRadius: '50%',
                    marginRight: '1rem'
                  }}></div>
                  Loading ticket...
                </>
              ) : (
                <p>Ticket not found</p>
              )}
            </div>
          ) : (
            /* Ticket Creation Form */
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            
            {/* Title Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '500',
                color: '#e2e8f0',
                marginBottom: '0.375rem'
              }}>
                Issue Title *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '0 0.75rem',
                  fontSize: '0.9rem',
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  outline: 'none',
                  backdropFilter: 'blur(10px)',
                  boxSizing: 'border-box',
                  height: '40px',
                  display: 'block',
                  lineHeight: '1.5'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.8)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Category Select */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '500',
                color: '#e2e8f0',
                marginBottom: '0.375rem'
              }}>
                Category *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0 0.75rem',
                  fontSize: '0.9rem',
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  outline: 'none',
                  backdropFilter: 'blur(10px)',
                  boxSizing: 'border-box',
                  height: '40px',
                  display: 'block',
                  lineHeight: '1.5'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.8)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="" style={{ background: '#1e293b', color: 'white' }}>Select a category</option>
                <option value="Hardware" style={{ background: '#1e293b', color: 'white' }}>Hardware Issues</option>
                <option value="Software" style={{ background: '#1e293b', color: 'white' }}>Software Problems</option>
                <option value="Network" style={{ background: '#1e293b', color: 'white' }}>Network & Connectivity</option>
                <option value="Email" style={{ background: '#1e293b', color: 'white' }}>Email Issues</option>
                <option value="Security" style={{ background: '#1e293b', color: 'white' }}>Security Concerns</option>
                <option value="Access" style={{ background: '#1e293b', color: 'white' }}>Access & Permissions</option>
                <option value="Other" style={{ background: '#1e293b', color: 'white' }}>Other</option>
              </select>
            </div>

            {/* Priority Select */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '500',
                color: '#e2e8f0',
                marginBottom: '0.375rem'
              }}>
                Priority Level
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0 0.75rem',
                  fontSize: '0.9rem',
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  outline: 'none',
                  backdropFilter: 'blur(10px)',
                  boxSizing: 'border-box',
                  height: '40px',
                  display: 'block',
                  lineHeight: '1.5'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.8)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="low" style={{ background: '#1e293b', color: 'white' }}> Low - Can wait</option>
                <option value="medium" style={{ background: '#1e293b', color: 'white' }}>Medium - Normal priority</option>
                <option value="high" style={{ background: '#1e293b', color: 'white' }}> High - Needs attention</option>
                <option value="urgent" style={{ background: '#1e293b', color: 'white' }}> Urgent - Critical issue</option>
              </select>
            </div>

            {/* Description Textarea */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '500',
                color: '#e2e8f0',
                marginBottom: '0.375rem'
              }}>
                Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  outline: 'none',
                  backdropFilter: 'blur(10px)',
                  boxSizing: 'border-box',
                  display: 'block',
                  lineHeight: '1.4',
                  resize: 'none',
                  flex: 1,
                  minHeight: '80px'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.8)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'white',
                backgroundImage: loading ? 'none' : 'linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa)',
                backgroundColor: loading ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                backgroundSize: '200% 200%',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(30, 64, 175, 0.4)',
                marginTop: '0.5rem'
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Creating Ticket...
                </div>
              ) : (
                'Create Ticket'
              )}
            </button>
            </form>
            </div>
          )}

          {/* Compact Footer */}
          <div style={{
            textAlign: 'center',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              {isViewMode ? (
                <>
                  <Link 
                    to="/dashboard"
                    style={{
                      color: '#60a5fa',
                      textDecoration: 'none',
                      fontWeight: '500',
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#93c5fd'}
                    onMouseLeave={(e) => e.target.style.color = '#60a5fa'}
                  >
                    ← Back to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  Need help?{' '}
                  <Link 
                    to="/dashboard"
                    style={{
                      color: '#60a5fa',
                      textDecoration: 'none',
                      fontWeight: '500',
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#93c5fd'}
                    onMouseLeave={(e) => e.target.style.color = '#60a5fa'}
                  >
                    View existing tickets
                  </Link>
          </>
        )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateTicket
