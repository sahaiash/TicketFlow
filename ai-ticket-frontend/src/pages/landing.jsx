import { Link } from "react-router-dom";

export default function Landing() {
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
      {/* Animated Background Orbs */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent)',
          filter: 'blur(40px)',
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.3), transparent)',
          filter: 'blur(35px)',
        }}></div>
        <div style={{
          position: 'absolute',
          top: '60%',
          left: '50%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(147, 197, 253, 0.2), transparent)',
          filter: 'blur(30px)',
          transform: 'translateX(-50%)'
        }}></div>
      </div>

      {/* Main Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', width: '100%' }}>
          
          {/* Main Title */}
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 7rem)',
            fontWeight: '900',
            marginBottom: '2rem',
            background: 'linear-gradient(135deg, #ffffff, #e2e8f0, #cbd5e1, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 40px rgba(255, 255, 255, 0.3)',
            letterSpacing: '-0.02em',
            lineHeight: '1.1'
          }}>
            TicketFlow
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1.2rem, 3vw, 2rem)',
            color: '#e2e8f0',
            fontWeight: '300',
            marginBottom: '3rem',
            opacity: 0.9,
            lineHeight: '1.4'
          }}>
            Streamline Your Support Experience
          </p>

          {/* Buttons Container */}
          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth < 640 ? 'column' : 'row',
            gap: '1.5rem',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '3rem'
          }}>
            
            {/* Login Button */}
            <Link 
              to="/login"
              style={{
                display: 'inline-block',
                padding: '1rem 2.5rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50px',
                textDecoration: 'none',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
                cursor: 'pointer',
                minWidth: '140px'
              }}
            >
              Login
            </Link>

            {/* Sign Up Button */}
            <Link 
              to="/signup"
              style={{
                display: 'inline-block',
                padding: '1rem 2.5rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'white',
                background: 'linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa)',
                backgroundSize: '200% 200%',
                border: 'none',
                borderRadius: '50px',
                textDecoration: 'none',
                boxShadow: '0 8px 32px rgba(30, 64, 175, 0.4)',
                cursor: 'pointer',
                minWidth: '140px',
              }}
            >
              Sign Up Free
            </Link>
          </div>

          {/* Decorative Dots */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            opacity: 0.6
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#93c5fd',
            }}></div>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#60a5fa',
            }}></div>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#3b82f6',
            }}></div>
          </div>

        </div>
      </div>
    </div>
  );
}
