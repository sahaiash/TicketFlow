import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

function Signup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (error) setError(''); // Clear error when user starts typing
  }

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        setError(data.error || data.message || "Signup failed");
      }
    } catch (err) {
      setError("Signup failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

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
          top: '15%',
          right: '15%',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent)',
          filter: 'blur(40px)',
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '15%',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.2), transparent)',
          filter: 'blur(35px)',
        }}></div>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(147, 197, 253, 0.15), transparent)',
          filter: 'blur(30px)',
          transform: 'translate(-50%, -50%)'
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
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '3rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link 
              to="/" 
              style={{
                fontSize: '1.8rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #ffffff, #e2e8f0, #cbd5e1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textDecoration: 'none',
                marginBottom: '0.5rem',
                display: 'block'
              }}
            >
              TicketFlow
            </Link>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#e2e8f0',
              marginBottom: '0.5rem'
            }}>
              Create Account
            </h2>
            <p style={{
              color: '#94a3b8',
              fontSize: '0.9rem'
            }}>
              Join TicketFlow and streamline your support experience
            </p>
          </div>

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

          {/* Signup Form */}
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Name Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#e2e8f0',
                marginBottom: '0.5rem'
              }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
                style={{
                  width: '100%',
                  padding: '0 1rem',
                  fontSize: '1rem',
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  outline: 'none',
                  backdropFilter: 'blur(10px)',
                  boxSizing: 'border-box',
                  height: '50px',
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

            {/* Email Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#e2e8f0',
                marginBottom: '0.5rem'
              }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '0 1rem',
                  fontSize: '1rem',
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  outline: 'none',
                  backdropFilter: 'blur(10px)',
                  boxSizing: 'border-box',
                  height: '50px',
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

            {/* Password Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#e2e8f0',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                style={{
                  width: '100%',
                  padding: '0 1rem',
                  fontSize: '1rem',
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  outline: 'none',
                  backdropFilter: 'blur(10px)',
                  boxSizing: 'border-box',
                  height: '50px',
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

            {/* Confirm Password Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#e2e8f0',
                marginBottom: '0.5rem'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                style={{
                  width: '100%',
                  padding: '0 1rem',
                  fontSize: '1rem',
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  outline: 'none',
                  backdropFilter: 'blur(10px)',
                  boxSizing: 'border-box',
                  height: '50px',
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

            {/* Signup Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: 'white',
                backgroundImage: loading ? 'none' : 'linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa)',
                backgroundColor: loading ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                backgroundSize: '200% 200%',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 32px rgba(30, 64, 175, 0.4)',
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
                  }}></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Already have an account?{' '}
              <Link 
                to="/login"
                style={{
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup
