import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services';
import { FaPaperPlane, FaCalendarAlt, FaUser, FaChevronDown, FaChevronUp, FaTimes } from 'react-icons/fa';
import './DashboardPage.css'; // Reuse dashboard styles

const ClientsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteCurrency, setQuoteCurrency] = useState('LKR');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingMessages, setBookingMessages] = useState({});
  const [messageTextByBooking, setMessageTextByBooking] = useState({});

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await bookingService.getGuideBookings(user.id);
      setBookings(response.data.bookings || []);
    } catch (err) {
      setError('Failed to load client requests');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleQuotePrice = async (e) => {
    e.preventDefault();
    if (!quotePrice.trim()) {
      setError('Please enter a price quote');
      return;
    }

    try {
      setLoading(true);
      await bookingService.quotePrice(selectedBooking.id, quotePrice, quoteCurrency);
      setSuccess('Quote sent successfully!');
      setSelectedBooking(null);
      setQuotePrice('');
      setQuoteCurrency('LKR');
      fetchBookings();
    } catch (err) {
      setError('Failed to send quote');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingMessages = useCallback(async (bookingId) => {
    try {
      const response = await bookingService.getBookingMessages(bookingId);
      setBookingMessages(prev => ({
        ...prev,
        [bookingId]: response.data.messages || []
      }));
    } catch (err) {
      console.error('Failed to load booking messages:', err);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    bookings.forEach((booking) => {
      if (!bookingMessages[booking.id]) {
        fetchBookingMessages(booking.id);
      }
    });
  }, [bookings, bookingMessages, fetchBookingMessages]);

  const handleRejectBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    try {
      setLoading(true);
      await bookingService.rejectQuote(bookingId);
      setSuccess('Request rejected successfully');
      fetchBookings();
    } catch (err) {
      setError('Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (bookingId) => {
    const message = (messageTextByBooking[bookingId] || '').trim();
    if (!message) return;

    try {
      await bookingService.sendBookingMessage(bookingId, {
        authorId: user.id,
        message
      });
      setMessageTextByBooking(prev => ({
        ...prev,
        [bookingId]: ''
      }));
      fetchBookingMessages(bookingId);
      setSuccess('Message sent to the tourist');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    }
  };

  if (loading && bookings.length === 0) return <div className="container">Loading...</div>;

  return (
    <main className="dashboard-page">
      <div className="container">
        <h1>Client Requests</h1>
        <p>Manage your itinerary assistance requests from tourists</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
          <section className="dashboard-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 style={{ color: 'var(--text-head)', fontWeight: '800' }}>Engagement Queue</h2>
            {bookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No requests found yet.</p>
            ) : (
              <div className="bookings-list" style={{ marginTop: '20px' }}>
                {bookings.map(booking => (
                  <BookingRequestCard 
                    key={booking.id} 
                    booking={booking} 
                    user={user} 
                    messages={bookingMessages[booking.id] || []}
                    messageText={messageTextByBooking[booking.id] || ''}
                    onMessageChange={(val) => setMessageTextByBooking(prev => ({ ...prev, [booking.id]: val }))}
                    onSendMessage={() => handleSendMessage(booking.id)}
                    onSelectQuote={() => setSelectedBooking(booking)}
                    onReject={() => handleRejectBooking(booking.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {selectedBooking && (
            <div className="modal-overlay" style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(10px)'
            }}>
              <div className="modal-box" style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '32px',
                width: '95%',
                maxWidth: '550px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-head)', marginBottom: '24px' }}>Offer Price Quote</h3>
                <form onSubmit={handleQuotePrice}>
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={{ color: 'var(--text-head)', fontWeight: '700', marginBottom: '8px', display: 'block' }}>Professional Fee</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="number" 
                        className="auth-input"
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(e.target.value)}
                        placeholder="Enter amount..."
                        style={{ flex: 1, padding: '16px', fontSize: '1.1rem', fontWeight: '800' }}
                        required
                      />
                      <select 
                        className="auth-input"
                        value={quoteCurrency}
                        onChange={(e) => setQuoteCurrency(e.target.value)}
                        style={{ width: '100px', padding: '16px', fontSize: '1.1rem', fontWeight: '800', backgroundColor: 'var(--bg-page)' }}
                      >
                        <option value="LKR">LKR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: '12px', fontWeight: '800' }}>Send Quote</button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '12px 32px', borderRadius: '12px', fontWeight: '700' }} onClick={() => { setSelectedBooking(null); setQuotePrice(''); setQuoteCurrency('LKR'); }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

const BookingRequestCard = ({ booking, user, messages, messageText, onMessageChange, onSendMessage, onSelectQuote, onReject }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="booking-item" style={{
      padding: '20px',
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      marginBottom: '16px',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* TOP HIGH-DENSITY BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
             <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-head)', fontWeight: '800' }}>{booking.itinerary_title}</h4>
             <span className={`status-badge status-${booking.status}`} style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: '900',
                textTransform: 'uppercase'
              }}>
                {booking.status.toUpperCase()}
              </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FaUser style={{ fontSize: '0.8rem' }} /> {booking.tourist_name || 'Tourist'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FaCalendarAlt style={{ fontSize: '0.8rem' }} /> {booking.start_date}
              </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {booking.status === 'pending' && (
            <>
              <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px' }} onClick={onSelectQuote}>
                Quote Price
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '0.85rem', 
                  borderRadius: '8px', 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  color: '#ef4444', 
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }} 
                onClick={onReject}
              >
                <FaTimes /> Reject
              </button>
            </>
          )}
           {booking.status === 'quoted' && (
             <div style={{ color: '#10b981', fontWeight: '800', fontSize: '0.9rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #10b981' }}>
               {booking.currency || 'LKR'} {booking.quoted_price}
             </div>
           )}
           {booking.status === 'accepted' && (
             <div style={{ color: '#10b981', fontWeight: '900', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
               ✓ Confirmed
             </div>
           )}

          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
          >
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>

      {/* EXPANDABLE CONTENT */}
      {isExpanded && (
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            {/* TRIP DETAILS & CONTACT */}
            <div>
              <h5 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Request Details</h5>
              {booking.notes && <p style={{ fontStyle: 'italic', marginBottom: '15px', color: 'var(--text-body)', fontSize: '0.9rem' }}>"{booking.notes}"</p>}
              
              {booking.status === 'accepted' && (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-body)' }}><strong>Contact No:</strong> <a href={`tel:${booking.tourist_contact}`} style={{ color: 'var(--primary)', fontWeight: '800', textDecoration: 'none' }}>{booking.tourist_contact}</a></p>
                </div>
              )}

              <div style={{ backgroundColor: 'rgba(79, 70, 229, 0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: '800', fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Proposed Route</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {booking.itinerary_places?.map(place => (
                    <span key={place.place_id} style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-head)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontWeight: '600' }}>
                      {place.visit_order}. {place.name}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setShowChat(!showChat)}
                style={{ marginTop: '15px', padding: '10px 20px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', border: 'none', fontWeight: '800', cursor: 'pointer', width: '100%', fontSize: '0.85rem' }}
              >
                {showChat ? 'Hide Messenger' : 'Open Messenger Channel'}
              </button>
            </div>

            {/* MESSENGER COLUMN (Only if toggled) */}
            {showChat && (
              <div style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', paddingRight: '5px' }}>
                  {messages.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>No messages yet. Start the conversation!</p>
                  ) : (
                    messages.map(m => (
                      <div key={m.id} style={{ 
                        padding: '10px 12px', 
                        backgroundColor: m.author_email === user.email ? 'rgba(79, 70, 229, 0.15)' : 'var(--bg-card)', 
                        borderRadius: '12px',
                        alignSelf: m.author_email === user.email ? 'flex-end' : 'flex-start',
                        maxWidth: '90%',
                        fontSize: '0.85rem',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ fontSize: '0.65rem', marginBottom: '4px', opacity: 0.7, color: 'var(--text-muted)' }}>
                          {m.author_email === user.email ? 'You' : 'Tourist'} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ color: 'var(--text-body)' }}>{m.message}</div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                   <input 
                    type="text"
                    value={messageText}
                    onChange={(e) => onMessageChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
                    placeholder="Type message..."
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-page)', color: 'var(--text-body)', fontSize: '0.85rem', outline: 'none' }}
                   />
                   <button onClick={onSendMessage} className="btn btn-primary" style={{ padding: '0 15px', borderRadius: '10px' }}>
                     <FaPaperPlane style={{ fontSize: '0.9rem' }} />
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
