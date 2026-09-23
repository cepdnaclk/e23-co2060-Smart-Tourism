import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services';
import { FaMapMarkerAlt, FaCompass, FaUser, FaSignOutAlt, FaHome, FaMoon, FaSun, FaAtlas, FaBriefcase, FaComments, FaMapMarkedAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);


  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    let interval;
    if (isAuthenticated() && user) {
      // Skip fetching notifications when on pages that display them
      const shouldSkipFetch = 
        (user.role === 'guide' && location.pathname === '/clients') ||
        (user.role === 'tourist' && (location.pathname === '/travel-guides' || location.pathname === '/dashboard'));

      if (shouldSkipFetch) {
        setNotifications(0);
        return;
      }

      const fetchCount = async () => {
        try {
          if (user.role === 'guide') {
            const res = await bookingService.getNotificationCount(user.id);
            const newCount = res.data.count || 0;
            // Only update state if count actually changed
            setNotifications(prevCount => prevCount !== newCount ? newCount : prevCount);
          } else if (user.role === 'tourist') {
            // For tourists, we count bookings with status 'quoted' 
            const res = await bookingService.getTouristBookings(user.id);
            const quotedCount = (res.data.bookings || []).filter(b => b.status === 'quoted').length;
            // Only update state if count actually changed
            setNotifications(prevCount => prevCount !== quotedCount ? quotedCount : prevCount);
          }
        } catch (err) {
          console.error('Notification fetch error:', err);
        }
      };
      
      fetchCount();
      interval = setInterval(fetchCount, 30000); // Poll every 30s
    }
    return () => clearInterval(interval);
  }, [user, isAuthenticated, location.pathname]);

  // Keep notifications at 0 when on notification pages
  useEffect(() => {
    const isOnNotifPage =
      (user?.role === 'guide' && location.pathname === '/clients') ||
      (user?.role === 'tourist' && (location.pathname === '/travel-guides' || location.pathname === '/dashboard'));
    
    if (isOnNotifPage && notifications > 0) {
      setNotifications(0);
    }
  }, [location.pathname, notifications, user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <FaCompass className="navbar-icon" />
          Tourism System
        </Link>
        
        <ul className="nav-menu">
          <li>
            <button 
              onClick={toggleTheme} 
              className={`theme-toggle-btn ${isDarkMode ? 'dark-mode-btn' : 'light-mode-btn'}`}
              title="Toggle Theme"
            >
              {isDarkMode ? (
                <><FaSun size={14} /> <span>Light</span></>
              ) : (
                <><FaMoon size={14} /> <span>Dark</span></>
              )}
            </button>
          </li>
          <li>
            <Link to="/" className="nav-link">
              <FaHome /> Home
            </Link>
          </li>
          {(!isAuthenticated() || user?.role === 'tourist') && (
            <li>
              <Link to="/places" className="nav-link">
                <FaMapMarkerAlt /> Places
              </Link>
            </li>
          )}
          {user?.role !== 'admin' && (
            <li>
              <Link to="/travel-guides" className="nav-link" style={{ position: 'relative' }} onClick={() => setNotifications(0)}>
                <FaCompass /> Travel Guides
                {user?.role === 'tourist' && notifications > 0 && (
                  <span className="notif-badge">
                    {notifications}
                  </span>
                )}
              </Link>
            </li>
          )}
          
          {isAuthenticated() ? (
            <>
              {user?.role === 'tourist' && (
                <li>
                  <Link to="/itinerary" className="nav-link">
                    <FaAtlas /> My Itinerary
                  </Link>
                </li>
              )}
              {user?.role === 'guide' && (
                <li>
                  <Link to="/clients" className="nav-link" style={{ position: 'relative' }} onClick={() => setNotifications(0)}>
                    <FaBriefcase /> Clients
                    {notifications > 0 && (
                      <span className="notif-badge">
                        {notifications}
                      </span>
                    )}
                  </Link>
                </li>
              )}
              {user?.role === 'admin' && (
                <>
                  <li>
                    <Link to="/admin-dashboard?tab=tourists" className="nav-link">
                      <FaUser /> Tourists
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin-dashboard?tab=guides" className="nav-link">
                      <FaMapMarkedAlt /> Travel Guides
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin-dashboard?tab=comments" className="nav-link">
                      <FaComments /> Comments
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/dashboard" className="nav-link" style={{ position: 'relative' }} onClick={() => setNotifications(0)}>
                  <FaUser /> Dashboard
                  {user?.role === 'tourist' && notifications > 0 && (
                    <span className="notif-badge">
                      {notifications}
                    </span>
                  )}
                </Link>
              </li>
              <li className="nav-user">
                <button onClick={handleLogout} className="nav-link logout-btn">
                  <FaSignOutAlt /> Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="nav-link login-link">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="nav-link register-link">
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </motion.nav>
  );
};

export default Navbar;
