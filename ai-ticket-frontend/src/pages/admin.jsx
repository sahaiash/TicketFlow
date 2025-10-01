
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ role: "", skills: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem("token");

  // Add error boundary state
  const [hasError, setHasError] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!token) {
      setErrorMessage("No authentication token found. Please log in again.");
      return;
    }

    if (!import.meta.env.VITE_SERVER_URL) {
      setErrorMessage("Server URL not configured. Please check your environment variables.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
        setFilteredUsers(data);
      } else {
        console.error(data.error);
        setErrorMessage(data.error || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users", err);
      setErrorMessage("Error fetching users. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    try {
      fetchUsers();
    } catch (error) {
      console.error("Error in useEffect:", error);
      setHasError(true);
      setErrorMessage("An error occurred while loading the admin panel.");
    }
  }, [fetchUsers]);

  const handleEditClick = (user) => {
    setEditingUser(user.email);
    setFormData({
      role: user.role,
      skills: user.skills?.join(", "),
    });
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleUpdate = async () => {
    if (!token) {
      setErrorMessage("No authentication token found. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/update-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: editingUser,
            role: formData.role,
            skills: formData.skills
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update user");
        return;
      }

      setSuccessMessage(`User ${editingUser} updated successfully!`);
      setEditingUser(null);
      setFormData({ role: "", skills: "" });
      await fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Update failed", err);
      setErrorMessage("Update failed. Please try again.");
    }
  };

  const handleQuickPromote = async (userEmail, newRole) => {
    if (!token) {
      setErrorMessage("No authentication token found. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/update-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: userEmail,
            role: newRole,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update user");
        return;
      }

      setSuccessMessage(`User ${userEmail} promoted to ${newRole}!`);
      await fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Update failed", err);
      setErrorMessage("Update failed. Please try again.");
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    filterUsers(query, roleFilter);
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    filterUsers(searchQuery, role);
  };

  const filterUsers = (query, role) => {
    let filtered = users;
    
    if (query) {
      filtered = filtered.filter((user) => 
        user.email.toLowerCase().includes(query)
      );
    }
    
    if (role !== "all") {
      filtered = filtered.filter((user) => user.role === role);
    }
    
    setFilteredUsers(filtered);
  };


  // Error fallback UI
  if (hasError) {
    return (
      <div className="max-w-6xl mx-auto mt-10 p-4">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Error Loading Admin Panel</h3>
            <div className="text-xs">Something went wrong. Please try refreshing the page.</div>
          </div>
          <button 
            className="btn btn-sm btn-outline"
            onClick={() => {
              setHasError(false);
              setErrorMessage("");
              fetchUsers();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
        fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
        backgroundImage: 'linear-gradient(-45deg, #0f172a, #1e293b, #334155, #475569, #64748b)'
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
            filter: 'blur(40px)'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '20%',
            left: '10%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(96, 165, 250, 0.15), transparent)',
            filter: 'blur(30px)'
          }}></div>
        </div>

        {/* Main Content */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          height: '100vh',
          overflow: 'auto',
          padding: '0.75rem'
        }}>
        {/* Header */}
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
              Admin Panel
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              Manage user roles and permissions
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link 
              to="/dashboard"
              style={{
                backgroundImage: 'linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa)',
                color: 'white',
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.75rem',
                boxShadow: '0 1px 4px rgba(30, 64, 175, 0.4)'
              }}
            >
              ← Back to Dashboard
            </Link>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#e2e8f0',
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {users.length} Users
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#22c55e',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#ef4444',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Filters and Search */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '0.75rem',
          marginBottom: '0.75rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '0.75rem' }}>
              <div style={{ width: '300px' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: '#e2e8f0', fontSize: '0.75rem', fontWeight: '500' }}>Search Users</label>
                <div style={{ position: 'relative' }}>
      <input
        type="text"
                    placeholder="Search by email..."
        value={searchQuery}
        onChange={handleSearch}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem 0.5rem 2rem',
                      color: 'white',
                      fontSize: '0.75rem',
                      outline: 'none',
                    }}
                  />
                  <svg style={{
                    position: 'absolute',
                    left: '0.5rem',
                    top: '50%',
                    marginTop: '-7px',
                    width: '14px',
                    height: '14px',
                    color: '#94a3b8'
                  }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: '#e2e8f0', fontSize: '0.75rem', fontWeight: '500' }}>Filter by Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => handleRoleFilter(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    color: 'white',
                    fontSize: '0.75rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all" style={{ background: '#1e293b', color: 'white' }}>All Users</option>
                  <option value="user" style={{ background: '#1e293b', color: 'white' }}>Users Only</option>
                  <option value="moderator" style={{ background: '#1e293b', color: 'white' }}>Moderators Only</option>
                  <option value="admin" style={{ background: '#1e293b', color: 'white' }}>Admins Only</option>
                </select>
              </div>
            </div>
          
          {/* Statistics Cards */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem',
              textAlign: 'center',
              flex: 1
            }}>
              <div style={{ color: '#60a5fa', fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.125rem' }}>
                {users.length}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.625rem', fontWeight: '500' }}>Total Users</div>
            </div>
            
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem',
              textAlign: 'center',
              flex: 1
            }}>
              <div style={{ color: '#f59e0b', fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.125rem' }}>
                {users.filter(u => u.role === 'moderator').length}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.625rem', fontWeight: '500' }}>Moderators</div>
            </div>
            
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem',
              textAlign: 'center',
              flex: 1
            }}>
              <div style={{ color: '#22c55e', fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.125rem' }}>
                {users.filter(u => u.role === 'user').length}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.625rem', fontWeight: '500' }}>Regular Users</div>
            </div>
          </div>
        </div>

        {/* User List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem 0',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(59, 130, 246, 0.3)',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                margin: '0 auto 0.75rem'
              }}></div>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem 0',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👥</div>
              <h3 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>No users found</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No users match your current search criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {filteredUsers.map((user) => (
        <div
          key={user._id}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '0.75rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.125rem' }}>
                  {user.email}
                </div>
                <div style={{
                  background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 
                            user.role === 'moderator' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  border: user.role === 'admin' ? '1px solid rgba(239, 68, 68, 0.3)' : 
                         user.role === 'moderator' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '4px',
                  padding: '0.125rem 0.375rem',
                  fontSize: '0.625rem',
                  fontWeight: '500',
                  color: user.role === 'admin' ? '#ef4444' : 
                        user.role === 'moderator' ? '#f59e0b' : '#60a5fa',
                  display: 'inline-block'
                }}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              </div>
            </div>
                      
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {user.role === "user" && (
                <button
                  onClick={() => handleQuickPromote(user.email, "moderator")}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    color: 'white',
                    fontSize: '0.625rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.125rem',
                    boxShadow: '0 1px 4px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  Promote
                </button>
              )}
              
              {user.role === "moderator" && (
                <button
                  onClick={() => handleQuickPromote(user.email, "user")}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    color: 'white',
                    fontSize: '0.625rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.125rem',
                    boxShadow: '0 1px 4px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                  Demote
                </button>
              )}

              <button
                onClick={() => handleEditClick(user)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  color: 'white',
                  fontSize: '0.625rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.125rem',
                }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            </div>
          </div>
          
          <div style={{ color: '#94a3b8', fontSize: '0.625rem', marginTop: '0.5rem' }}>
            <span style={{ fontWeight: '500' }}>Skills:</span> {user.skills && user.skills.length > 0 ? user.skills.join(", ") : "No skills specified"}
          </div>

          {/* Edit Form */}
          {editingUser === user.email && (
            <div style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '0 0 8px 8px',
              padding: '0.75rem',
              marginTop: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem' }}>
                <svg width="16" height="16" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h4 style={{ color: 'white', fontSize: '0.75rem', fontWeight: '600' }}>Edit User Details</h4>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#e2e8f0', fontSize: '0.625rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '0.375rem 0.5rem',
                      color: 'white',
                      fontSize: '0.625rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="user" style={{ background: '#1e293b', color: 'white' }}>User</option>
                    <option value="moderator" style={{ background: '#1e293b', color: 'white' }}>Moderator</option>
                    <option value="admin" style={{ background: '#1e293b', color: 'white' }}>Admin</option>
              </select>
                </div>

                <div style={{ flex: 2 }}>
                  <label style={{ color: '#e2e8f0', fontSize: '0.625rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                    Skills
                  </label>
              <input
                type="text"
                placeholder="Comma-separated skills"
                value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '0.375rem 0.5rem',
                      color: 'white',
                      fontSize: '0.625rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <button
                  onClick={handleUpdate}
                  style={{
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    color: 'white',
                    fontSize: '0.625rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.125rem',
                    boxShadow: '0 1px 4px rgba(34, 197, 94, 0.3)'
                  }}
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    color: 'white',
                    fontSize: '0.625rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.125rem',
                  }}
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
          )}
        </div>
        </div>
      </div>
    </div>
    </div>
  );
}
