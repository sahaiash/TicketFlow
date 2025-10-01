import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CheckAuth from './components/checkAuth.jsx'
import Ticket from './pages/ticket.jsx'
import Tickets from './pages/tickets.jsx'
import Signup from './pages/signup.jsx'
import Login from './pages/login.jsx'
import Admin from './pages/admin.jsx'
import Landing from './pages/landing.jsx'
import Moderators from './pages/moderators.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    {/* this is the main routes that renders the app */}
    <Routes>
      {/* Landing page - accessible to everyone */}
      <Route path='/' element={<Landing />} />
      
      {/* Dashboard - protected route */}
      <Route
        path='/dashboard'
        element={
          <CheckAuth protectedRoute={true}>
            <Tickets/>
          </CheckAuth>
        }
      />
      {/* Create new ticket page */}
      <Route
        path="/ticket"
        element={
          <CheckAuth protectedRoute={true}>
            <Ticket/>
          </CheckAuth>
        }
      />
      {/* View ticket details page */}
      <Route
        path="/ticket/:id"
        element={
          <CheckAuth protectedRoute={true}>
            <Ticket/>
          </CheckAuth>
        }
      />
      {/* this is the signup page */}
      <Route
        path="/signup"
        element={
          <CheckAuth protectedRoute={false}>
            <Signup/>
          </CheckAuth>
        }
      />
      {/* this is the login page */}
      <Route
        path="/login"
        element={
          <CheckAuth protectedRoute={false}>
            <Login/>
          </CheckAuth>
        }
      />
      {/* this is the admin page */}
      <Route
        path="/admin"
        element={
          <CheckAuth protectedRoute={true}>
            <Admin/>
          </CheckAuth>
        }
      />
      {/* this is the moderators page */}
      <Route
        path="/moderators"
        element={
          <CheckAuth protectedRoute={true}>
            <Moderators/>
          </CheckAuth>
        }
      />
    </Routes>
    </BrowserRouter>
  </StrictMode>,
)
