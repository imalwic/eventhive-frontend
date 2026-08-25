"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Ticket, CalendarPlus, Settings, BarChart2, Users, ShieldAlert, CheckCircle2, MessageSquare, CreditCard, Image as ImageIcon, TrendingUp, PieChart as PieChartIcon, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import Chatbot from "@/components/Chatbot";
import RichTextEditor from "@/components/RichTextEditor";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data);
        setRole(res.data.role); // Expected to be "ATTENDEE", "ORGANIZER", or "ADMIN"
      } catch (err) {
        console.error("Failed to fetch user", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchUser();
    }
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {role !== "ADMIN" && <Chatbot />}
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-black mb-2">Dashboard</h1>
            <p className="text-foreground/70">Welcome back, {user?.name}!</p>
          </div>
        </div>

        {role === "ORGANIZER" && (typeof window !== "undefined" ? localStorage.getItem("uiMode") || "ORGANIZER" : "ORGANIZER") === "ORGANIZER" && <OrganizerDashboard />}
        {(role === "ATTENDEE" || (role === "ORGANIZER" && (typeof window !== "undefined" ? localStorage.getItem("uiMode") : "") === "ATTENDEE")) && <AttendeeDashboard />}
        {role === "ADMIN" && <AdminDashboard />}
      </div>
    </div>
  );
}



function OrganizerDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalEvents: 0, totalTicketsSold: 0, totalRevenue: 0 });
  const [attendees, setAttendees] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, statsRes, attendeesRes, waitlistRes, ticketsRes] = await Promise.all([
          api.get("/events/my"),
          api.get("/events/my/stats").catch(() => ({ data: { totalEvents: 0, totalTicketsSold: 0, totalRevenue: 0 } })),
          api.get("/events/my/attendees").catch(() => ({ data: [] })),
          api.get("/events/my/waitlist").catch(() => ({ data: [] })),
          api.get("/events/my/tickets").catch(() => ({ data: [] }))
        ]);
        setEvents(eventsRes.data);
        if (statsRes && statsRes.data) {
          setStats(statsRes.data);
        }
        if (attendeesRes && attendeesRes.data) {
          setAttendees(attendeesRes.data);
        }
        if (waitlistRes && waitlistRes.data) {
          setWaitlist(waitlistRes.data);
        }
        if (ticketsRes && ticketsRes.data) {
          setTickets(ticketsRes.data);
        }
      } catch (error) {
        console.error("Failed to load organizer data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: "Total Events Hosted", value: stats.totalEvents.toString(), icon: <CalendarPlus />, color: "from-primary/20 to-primary/5", iconColor: "text-primary", bg: "bg-primary/10" },
          { label: "Total Tickets Sold", value: stats.totalTicketsSold.toString(), icon: <Ticket />, color: "from-accent/20 to-accent/5", iconColor: "text-accent", bg: "bg-accent/10" },
          { label: "Total Revenue", value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: <BarChart2 />, color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((stat, i) => (
          <div key={i} className={`glass-card p-6 rounded-3xl border border-border flex items-center justify-between relative overflow-hidden`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-50`}></div>
            <div className="relative z-10">
              <p className="text-foreground/70 text-sm font-semibold mb-1 uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-black">{stat.value}</p>
            </div>
            <div className={`relative z-10 w-14 h-14 ${stat.bg} rounded-full flex items-center justify-center ${stat.iconColor} shadow-lg backdrop-blur-md`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-8 rounded-3xl border border-border">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-6">
          <h2 className="text-2xl font-black">Your Events</h2>
          <button onClick={() => window.location.href = '/events/create'} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/25">
            <CalendarPlus size={18} />
            Create Event
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-foreground/50">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-foreground/50 bg-secondary/30 rounded-2xl border border-dashed border-border">
            <CalendarPlus size={48} className="opacity-20 mx-auto mb-4" />
            <p className="text-lg font-medium">No active events yet</p>
            <p className="text-sm">Click the Create Event button to start organizing!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((ev: any) => (
              <div key={ev.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-secondary/50 rounded-2xl border border-border/50 hover:border-primary/30 hover:bg-secondary transition-colors group">
                 <div className="flex items-center gap-5">
                   <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                     <CalendarPlus size={24} />
                   </div>
                   <div>
                     <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{ev.title}</h4>
                     <p className="text-sm text-foreground/60 flex items-center gap-2">
                       <span>📍 {ev.venue}</span>
                       <span>•</span>
                       <span>🕒 {new Date(ev.eventDate).toLocaleDateString()}</span>
                     </p>
                   </div>
                 </div>
                 <div className="flex items-center justify-between sm:justify-end gap-6 mt-4 sm:mt-0">
                   <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                     new Date(ev.eventDate) < new Date() ? 'bg-secondary text-foreground/50 border border-border' :
                     ev.status === 'PUBLISHED' || ev.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                     ev.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                     'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                   }`}>
                     {new Date(ev.eventDate) < new Date() ? 'COMPLETED' : ev.status || 'PENDING'}
                   </span>
                   <button onClick={() => window.location.href = `/events/${ev.id}/manage`} className="text-sm font-bold text-foreground/50 hover:text-primary transition-colors px-4 py-2 rounded-xl hover:bg-primary/10">
                     Manage
                   </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AttendeeDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [waitlists, setWaitlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<string>("");
  const [prefInput, setPrefInput] = useState<string>("");
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [savedEvents, setSavedEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, waitlistsRes] = await Promise.all([
          api.get("/bookings/my-tickets").catch(() => ({ data: [] })),
          api.get("/waitlist/my").catch(() => ({ data: [] }))
        ]);
        setBookings(bookingsRes.data);
        setWaitlists(waitlistsRes.data);
        
        const saved = JSON.parse(localStorage.getItem('savedEvents') || '[]');
        setSavedEvents(saved);
      } catch (error) {
        console.error("Failed to load attendee data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="col-span-1 lg:col-span-2 glass-card p-6 rounded-3xl border border-border bg-gradient-to-r from-primary/10 to-accent/10 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2">Ready for your next event?</h3>
            <p className="text-foreground/70 text-sm mb-4">Discover new experiences trending in your area.</p>
          </div>
          <button onClick={() => window.location.href = "/events"} className="px-4 py-2 bg-background border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition-colors w-max">Browse Events</button>
        </div>
        {[
          { label: "My Bookings", value: bookings.length.toString(), icon: <Ticket /> },
          { label: "Waitlisted", value: waitlists.length.toString(), icon: <Settings /> },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl border border-border flex items-center justify-between">
            <div>
              <p className="text-foreground/60 text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-2xl font-black">{stat.value}</p>
            </div>
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-accent">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        <div className="glass-card p-8 rounded-3xl border border-border">
          <h2 className="text-xl font-bold mb-6 border-b border-border pb-4">Digital Tickets</h2>
          
          {loading ? (
            <div className="text-center py-12 text-foreground/50">Loading tickets...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-foreground/50 flex flex-col items-center">
              <Ticket size={48} className="opacity-20 mx-auto mb-4" />
              <p>You haven't booked any events yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookings.map((booking: any) => (
                <div key={booking.id} className="flex flex-col bg-secondary rounded-3xl overflow-hidden border border-border/50 hover:border-primary/50 transition-colors shadow-xl group">
                  <div className="h-32 bg-primary/20 relative">
                    {booking.event?.venueImageUrl && (
                      <img src={`http://localhost:8080${booking.event.venueImageUrl}`} alt="Venue" className="w-full h-full object-cover opacity-50" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary to-transparent"></div>
                    <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                      <h3 className="text-xl font-black">{booking.event?.title || 'Unknown Event'}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'PAID' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <p className="text-sm text-foreground/70 mb-1">{booking.event?.venue} • {booking.event?.eventDate ? new Date(booking.event.eventDate).toLocaleDateString() : ''}</p>
                      <p className="text-xs text-foreground/50 mb-4">Booked on {new Date(booking.bookingDate).toLocaleDateString()}</p>
                      
                      <div className="flex gap-2 flex-wrap mb-6">
                        {booking.seats?.map((seat: any, idx: number) => (
                          <span key={idx} className="bg-background px-3 py-1.5 rounded-lg text-xs font-bold border border-border">
                            Seat {seat.seatNumber}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border border-dashed">
                      <div className="text-primary font-black text-lg">Rs. {booking.totalAmount}</div>
                      <button 
                        onClick={() => {
                          const modal = document.createElement('div');
                          modal.className = "fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm";
                          modal.onclick = () => document.body.removeChild(modal);
                          
                          const content = document.createElement('div');
                          content.className = "bg-secondary p-8 rounded-3xl border border-border flex flex-col items-center max-w-sm w-full mx-4";
                          content.onclick = (e) => e.stopPropagation();
                          
                          content.innerHTML = `
                            <h3 class="text-2xl font-black mb-2 text-center">${booking.event?.title}</h3>
                            <p class="text-foreground/70 text-sm mb-6 text-center">Scan this code at the entrance</p>
                            <div class="bg-white p-4 rounded-xl mb-6">
                              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${booking.id}" alt="QR Code" class="w-48 h-48" />
                            </div>
                            <button class="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold">Close</button>
                          `;
                          
                          const closeBtn = content.querySelector('button');
                          if(closeBtn) closeBtn.onclick = () => document.body.removeChild(modal);
                          
                          modal.appendChild(content);
                          document.body.appendChild(modal);
                        }}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                      >
                        <Ticket size={16} /> View Ticket
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Waitlist Section */}
        {waitlists.length > 0 && (
          <div className="glass-card p-8 rounded-3xl border border-border border-l-4 border-l-accent">
            <h2 className="text-xl font-bold mb-6 border-b border-border pb-4 flex items-center gap-2">
              <Settings className="text-accent" /> Your Waitlists
            </h2>
            <div className="space-y-4">
              {waitlists.map((wl: any) => (
                <div key={wl.id} className="flex items-center justify-between p-4 bg-secondary rounded-2xl">
                  <div>
                    <h4 className="font-bold">{wl.event?.title}</h4>
                    <p className="text-xs text-foreground/60">Position in queue: {wl.position}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${wl.notified ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {wl.notified ? 'Seat Available!' : 'Waiting...'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Saved Events Section */}
      {savedEvents.length > 0 && (
        <div className="glass-card p-8 rounded-3xl border border-border mt-8">
          <h2 className="text-xl font-bold mb-6 border-b border-border pb-4 flex items-center gap-2">
            <Ticket className="text-pink-500" /> Saved Events (Wishlist)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {savedEvents.map((ev: any) => (
              <div key={ev.id} className="bg-secondary rounded-2xl overflow-hidden border border-border/50 group cursor-pointer" onClick={() => window.location.href = `/events/${ev.id}`}>
                <div className="h-32 bg-primary/20 relative">
                  {ev.venueImageUrl && (
                    <img src={`http://localhost:8080${ev.venueImageUrl}`} alt="Event" className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary to-transparent"></div>
                  <h4 className="absolute bottom-3 left-4 right-4 font-black text-lg">{ev.title}</h4>
                </div>
                <div className="p-4">
                  <p className="text-sm text-foreground/70">{ev.venue}</p>
                  <p className="text-xs text-foreground/50 mt-1">{ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : ''}</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const newSaved = savedEvents.filter((item: any) => item.id !== ev.id);
                      setSavedEvents(newSaved);
                      localStorage.setItem('savedEvents', JSON.stringify(newSaved));
                      toast.success("Removed from Saved Events");
                    }}
                    className="mt-4 text-xs font-bold text-red-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations Section */}
      <div className="glass-card p-8 rounded-3xl border border-border mt-8">
        <h2 className="text-xl font-bold mb-6 border-b border-border pb-4 flex items-center gap-2">
          <Sparkles className="text-primary" /> Ask AI for Recommendations
        </h2>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input 
            type="text" 
            placeholder="E.g., I'm looking for a weekend music festival or tech conference..."
            value={prefInput}
            onChange={(e) => setPrefInput(e.target.value)}
            className="flex-grow px-4 py-3 bg-secondary border border-border rounded-xl outline-none focus:border-primary transition-colors"
          />
          <button 
            onClick={async () => {
              if (!prefInput) return;
              setLoadingRecs(true);
              try {
                const res = await api.post("/ai/recommend", { preferences: prefInput });
                setRecommendations(res.data.recommendations);
              } catch (err) {
                toast.error("Failed to get recommendations");
              } finally {
                setLoadingRecs(false);
              }
            }}
            disabled={loadingRecs}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors whitespace-nowrap flex items-center justify-center"
          >
            {loadingRecs ? "Thinking..." : "Get Ideas"}
          </button>
        </div>
        
        {recommendations && (
          <div className="p-6 bg-secondary/50 rounded-2xl border border-border/50 text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {recommendations.replace(/<think>[\s\S]*?<\/think>/g, '').trim()}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AdminDashboard() {
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview'|'organizers'|'events'|'messages'|'settings'|'payments'>('overview');
  const [settings, setSettings] = useState<any>({});
  const [messages, setMessages] = useState<any[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [stats, setStats] = useState<any>({ totalRevenue: 0, totalOrganizers: 0, totalEvents: 0 });
  const [chartData, setChartData] = useState<any>({ revenueData: [], packageData: [] });
  const [searchQuery, setSearchQuery] = useState("");
  
  const COLORS = ['#3b82f6', '#a855f7', '#eab308'];
  
  const fetchData = async () => {
    try {
      const [organizersRes, eventsRes, pendingRes, settingsRes, messagesRes, statsRes, pendingPaymentsRes, chartRes] = await Promise.all([
        api.get("/users/organizers"),
        api.get("/events"),
        api.get("/users/pending"),
        api.get("/settings"),
        api.get("/contact/messages"),
        api.get("/users/admin/stats"),
        api.get("/subscriptions/admin/pending"),
        api.get("/users/admin/chart-data")
      ]);
      setOrganizers(organizersRes.data);
      setEvents(eventsRes.data);
      setPendingOrganizers(pendingRes.data);
      setSettings(settingsRes.data);
      setMessages(messagesRes.data);
      setStats(statsRes.data);
      setPendingPayments(pendingPaymentsRes.data);
      setChartData(chartRes.data);
    } catch (err) {
      console.error("Failed to load admin data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setActionLoading(`${action}-${id}`);
    try {
      await api.post(`/users/${action}/${id}`);
      fetchData();
      toast.success(`Organizer ${action}ed successfully.`);
    } catch (error) {
      console.error(`Failed to ${action} organizer`, error);
      toast.error(`Failed to ${action} organizer. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePaymentAction = async (id: number, action: 'approve' | 'reject') => {
    setActionLoading(`payment-${action}-${id}`);
    try {
      await api.post(`/subscriptions/admin/${action}/${id}`);
      fetchData();
      toast.success(`Payment ${action}ed successfully.`);
    } catch (error) {
      console.error(`Failed to ${action} payment.`, error);
      toast.error(`Failed to ${action} payment. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOrganizer = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this organizer?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchData();
      toast.success("Organizer deleted.");
    } catch (error) {
      toast.error("Failed to delete organizer.");
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this event?")) return;
    try {
      await api.delete(`/events/admin/${id}`);
      fetchData();
      toast.success("Event deleted.");
    } catch (error) {
      toast.error("Failed to delete event.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.put("/settings", settings);
      toast.success("Site settings updated successfully!");
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/contact/messages/${id}/read`);
      setMessages(messages.map(m => m.id === id ? {...m, status: 'READ'} : m));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const unreadCount = messages.filter(m => m.status === 'UNREAD').length;
  
  const filteredOrganizers = organizers.filter(o => 
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-wrap gap-4 mb-8">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'payments', label: 'Payments', badge: pendingPayments.length },
          { id: 'organizers', label: 'Organizers' },
          { id: 'events', label: 'Events' },
          { id: 'messages', label: 'Messages', badge: unreadCount },
          { id: 'settings', label: 'Site Settings' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-6 py-2 rounded-xl font-bold transition-colors relative ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-foreground/60 hover:text-foreground'}`}
          >
            {tab.label}
            {tab.badge ? (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-background">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: "Total Platform Revenue", value: `LKR ${stats.totalRevenue.toLocaleString()}`, icon: <BarChart2 /> },
              { label: "Total Organizers", value: stats.totalOrganizers.toString(), icon: <Users /> },
              { label: "Total Events", value: stats.totalEvents.toString(), icon: <Ticket /> },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 rounded-3xl border border-border flex items-center justify-between bg-primary/5">
                <div>
                  <p className="text-foreground/60 text-sm font-medium mb-1">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.value}</p>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div className="lg:col-span-2 glass-card p-8 rounded-3xl border border-border">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="text-primary" /> Revenue Growth (Last 6 Months)
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff3366" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)'}} dx={-10} tickFormatter={(val) => `LKR ${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                      itemStyle={{ color: '#ff3366', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#ff3366" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-8 rounded-3xl border border-border flex flex-col justify-between">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <PieChartIcon className="text-primary" /> Package Distribution
              </h2>
              <div className="h-[200px] w-full flex-1">
                {chartData.packageData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-foreground/50">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.packageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.packageData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '12px', border: 'none' }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-6 flex justify-center gap-4">
                {chartData.packageData.map((entry: any, index: number) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm font-semibold">
                    <span className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-border max-w-4xl">
              <h2 className="text-xl font-bold mb-6 border-b border-border pb-4 flex items-center justify-between">
                Pending Organizer Approvals
              {pendingOrganizers.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{pendingOrganizers.length}</span>
              )}
            </h2>
            
            {pendingOrganizers.length === 0 ? (
              <div className="text-center py-12 text-foreground/50">
                <ShieldAlert size={48} className="opacity-20 mx-auto mb-4" />
                <p>No pending approvals at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrganizers.map(u => (
                  <div key={u.id} className="p-5 border border-border bg-secondary/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-lg">{u.name}</p>
                      <p className="text-sm text-foreground/60">{u.email} • {u.phone}</p>
                      <div className="mt-3">
                        <a 
                          href={`http://localhost:8080/uploads/proposals/${u.eventProposal}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-bold bg-primary/10 text-primary px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          <Ticket size={14} /> View PDF Proposal
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleAction(u.id, 'approve')}
                        disabled={actionLoading !== null}
                        className="bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `approve-${u.id}` ? 'Approving...' : 'Approve'}
                      </button>
                      <button 
                        onClick={() => handleAction(u.id, 'reject')}
                        disabled={actionLoading !== null}
                        className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `reject-${u.id}` ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'payments' && (
        <div className="glass-card p-8 rounded-3xl border border-border max-w-4xl">
          <h2 className="text-xl font-bold mb-6 border-b border-border pb-4 flex items-center justify-between">
            Pending Package Payments
            {pendingPayments.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{pendingPayments.length}</span>
            )}
          </h2>
          
          {pendingPayments.length === 0 ? (
            <div className="text-center py-12 text-foreground/50">
              <CreditCard size={48} className="opacity-20 mx-auto mb-4" />
              <p>No pending payments at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map(p => (
                <div key={p.id} className="p-5 border border-border bg-secondary/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-lg">{p.packageName} Package</p>
                    <p className="text-sm text-foreground/60">Amount: LKR {p.price.toLocaleString()} • Organizer: {p.organizer?.name || 'Unknown'}</p>
                    <div className="mt-3">
                      {p.paymentMethod === 'CARD' ? (
                        <div className="flex gap-2">
                          <span className="inline-flex items-center gap-2 text-xs font-bold bg-blue-500/10 text-blue-500 px-3 py-2 rounded-lg">
                            <CreditCard size={14} /> Paid Online (PayHere)
                          </span>
                          <button
                            onClick={() => {
                              const token = localStorage.getItem("token");
                              fetch(`http://localhost:8080/api/subscriptions/admin/invoice/${p.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              })
                              .then(res => res.blob())
                              .then(blob => {
                                const url = window.URL.createObjectURL(blob);
                                window.open(url, '_blank');
                              });
                            }}
                            className="inline-flex items-center gap-2 text-xs font-bold bg-primary/10 text-primary px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors"
                          >
                            <Ticket size={14} /> View Invoice
                          </button>
                        </div>
                      ) : (
                        <a 
                          href={`http://localhost:8080/uploads/payments/${p.paymentProof}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-bold bg-primary/10 text-primary px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          <ImageIcon size={14} /> View Bank Slip
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => handlePaymentAction(p.id, 'approve')}
                      disabled={actionLoading !== null}
                      className="bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `payment-approve-${p.id}` ? 'Approving...' : 'Approve'}
                    </button>
                    <button 
                      onClick={() => handlePaymentAction(p.id, 'reject')}
                      disabled={actionLoading !== null}
                      className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `payment-reject-${p.id}` ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'organizers' && (
        <div className="glass-card p-8 rounded-3xl border border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-border pb-4">
            <h2 className="text-xl font-bold">Registered Organizers</h2>
            <input 
              type="text" 
              placeholder="Search organizers..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:border-primary outline-none"
            />
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredOrganizers.length === 0 ? (
              <p className="text-center py-8 text-foreground/50">No organizers found.</p>
            ) : (
              filteredOrganizers.map(u => (
                <div key={u.id} className="flex justify-between items-center p-4 border border-border bg-background rounded-2xl">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold">{u.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${u.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' : u.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {u.status}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/60">{u.email} • {u.phone}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteOrganizer(u.id)}
                    className="text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Delete Organizer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="glass-card p-8 rounded-3xl border border-border">
          <h2 className="text-xl font-bold mb-6 border-b border-border pb-4">All Platform Events</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {events.length === 0 ? (
              <p className="text-center py-8 text-foreground/50">No events found on the platform.</p>
            ) : (
              events.map(e => (
                <div key={e.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-border bg-background rounded-2xl gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{e.title}</h3>
                    <p className="text-sm text-foreground/60">By {e.organizer?.name || 'Unknown'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-semibold">{e.date} • {e.time}</p>
                      <p className="text-xs text-foreground/50">{e.location}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteEvent(e.id)}
                      className="text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-2 rounded-lg transition-colors shrink-0"
                    >
                      Delete Event
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="glass-card p-8 rounded-3xl border border-border">
          <h2 className="text-xl font-bold mb-6 border-b border-border pb-4 flex items-center justify-between">
            Contact Messages
            {unreadCount > 0 && (
              <span className="bg-red-500/10 text-red-500 text-xs px-3 py-1 rounded-full font-bold">{unreadCount} Unread</span>
            )}
          </h2>
          
          {messages.length === 0 ? (
            <div className="text-center py-12 text-foreground/50">
              <MessageSquare size={48} className="opacity-20 mx-auto mb-4" />
              <p>No messages received yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`p-5 border rounded-2xl ${msg.status === 'UNREAD' ? 'bg-primary/5 border-primary/20' : 'bg-secondary/30 border-border'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{msg.firstName} {msg.lastName}</h3>
                        {msg.status === 'UNREAD' && <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
                      </div>
                      <a href={`mailto:${msg.email}`} className="text-sm text-primary hover:underline">{msg.email}</a>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-foreground/50 mb-2">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                      {msg.status === 'UNREAD' && (
                        <button 
                          onClick={() => handleMarkAsRead(msg.id)}
                          className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary/20 transition-colors"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-background p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="glass-card p-8 rounded-3xl border border-border">
          <h2 className="text-xl font-bold mb-6 border-b border-border pb-4">Manage Site Settings</h2>
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold mb-2 text-foreground/70">Contact Phone</label>
                <input 
                  type="text" 
                  value={settings.contactPhone || ''} 
                  onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                  className="w-full p-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none text-sm" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-foreground/70">Contact Email</label>
                <input 
                  type="email" 
                  value={settings.contactEmail || ''} 
                  onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                  className="w-full p-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none text-sm" 
                  required 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold mb-2 text-foreground/70">Contact Address</label>
              <textarea 
                value={settings.contactAddress || ''} 
                onChange={e => setSettings({...settings, contactAddress: e.target.value})}
                className="w-full p-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none text-sm min-h-[100px]" 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-2 text-foreground/70">Privacy Policy Content</label>
              <RichTextEditor 
                value={settings.privacyPolicyContent || ''} 
                onChange={(val) => setSettings({...settings, privacyPolicyContent: val})}
                placeholder="Write your Privacy Policy here..." 
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-2 text-foreground/70">Terms of Service Content</label>
              <RichTextEditor 
                value={settings.termsOfServiceContent || ''} 
                onChange={(val) => setSettings({...settings, termsOfServiceContent: val})}
                placeholder="Write your Terms of Service here..." 
              />
            </div>

            <button 
              type="submit" 
              disabled={savingSettings}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}
    </motion.div>
  );
}

