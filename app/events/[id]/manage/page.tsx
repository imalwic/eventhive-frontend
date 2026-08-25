"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, Ticket, Settings, CheckCircle2, DollarSign, Users, Grid as GridIcon, Scan } from "lucide-react";
import TicketScannerModal from "@/components/TicketScannerModal";

// Import the new VisualSeatEditor at the top
import VisualSeatEditor from "@/components/VisualSeatEditor";

function BookingStatsChart({ attendees, event }: { attendees: any[], event: any }) {
  // Extract categories and capacities from events
  const categoryCounts: Record<string, { sold: number, capacity: number }> = {};
  let totalSeatsSold = 0;
  let totalCapacity = 0;
  
  if (event && event.ticketCategories && event.ticketCategories.length > 0) {
    event.ticketCategories.forEach((cat: any) => {
      if (!categoryCounts[cat.name]) {
        categoryCounts[cat.name] = { sold: 0, capacity: cat.capacity || 0 };
        totalCapacity += cat.capacity || 0;
      }
    });
  }
  
  attendees.forEach(booking => {
    if (booking.seats && booking.seats.length > 0) {
      booking.seats.forEach((seat: any) => {
        const cat = seat.tierName || 'General';
        if (!categoryCounts[cat]) categoryCounts[cat] = { sold: 0, capacity: 0 };
        categoryCounts[cat].sold += 1;
        totalSeatsSold++;
      });
    } else {
      const cat = 'General';
      if (!categoryCounts[cat]) categoryCounts[cat] = { sold: 0, capacity: 0 };
      categoryCounts[cat].sold += 1;
      totalSeatsSold++;
    }
  });

  const categories = Object.keys(categoryCounts);
  const colors = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];
  
  const hasData = categories.length > 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <div className="glass-card p-8 rounded-3xl border border-border mb-8 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex-1 w-full">
        <h2 className="text-2xl font-black mb-2">Ticket Sales Overview</h2>
        <p className="text-foreground/70 mb-6">Real-time breakdown of your bookings by category</p>
        
        {hasData ? (
          <div className="space-y-4">
            {categories.map((cat, i) => {
              const data = categoryCounts[cat];
              const pct = data.capacity > 0 ? Math.round((data.sold / data.capacity) * 100) : (data.sold > 0 ? 100 : 0);
              const color = colors[i % colors.length];
              return (
                <div key={cat} className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                      <span className="font-semibold text-sm">{cat}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-foreground/60 text-xs">{data.sold} / {data.capacity} sold</span>
                      <span className="font-black w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-secondary/50 rounded-2xl border border-border/50 text-sm text-foreground/60">
            No categories created or tickets sold yet. Add ticket categories to your events to see the breakdown here.
          </div>
        )}
      </div>

      <div className="relative w-48 h-48 flex-shrink-0 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="transparent" stroke="currentColor" strokeWidth="20" className="text-secondary/50" />
          {hasData && (totalCapacity > 0 || totalSeatsSold > 0) && categories.map((cat, i) => {
            const data = categoryCounts[cat];
            const pct = totalCapacity > 0 ? data.sold / totalCapacity : (totalSeatsSold > 0 ? data.sold / totalSeatsSold : 0);
            const strokeDasharray = `${pct * circumference} ${circumference}`;
            const strokeDashoffset = -currentOffset;
            currentOffset += pct * circumference;
            return (
              <motion.circle 
                key={cat}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray }}
                transition={{ duration: 1, delay: i * 0.2, ease: "easeOut" }}
                cx="80" cy="80" r={radius} 
                fill="transparent" 
                stroke={colors[i % colors.length]} 
                strokeWidth="20" 
                strokeDashoffset={strokeDashoffset}
                className="drop-shadow-md"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black">{totalCapacity > 0 ? Math.round((totalSeatsSold / totalCapacity) * 100) : (totalSeatsSold > 0 ? 100 : 0)}%</span>
          <span className="text-[10px] text-foreground/60 font-bold uppercase tracking-wider leading-tight">Total<br/>Sold</span>
        </div>
      </div>
    </div>
  );
}

export default function ManageEventPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [event, setEvent] = useState<any>(null);
  const [seatStats, setSeatStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  
  // Category Form State
  const [categoryName, setCategoryName] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [attendees, setAttendees] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);
        
        // Also fetch seat stats, attendees, waitlist
        try {
          const [statsRes, attRes, waitRes, ticketsRes] = await Promise.all([
            api.get(`/seats/event/${id}/stats`),
            api.get(`/events/${id}/attendees`).catch(() => ({ data: [] })),
            api.get(`/events/${id}/waitlist`).catch(() => ({ data: [] })),
            api.get(`/events/${id}/tickets`).catch(() => ({ data: [] }))
          ]);
          setSeatStats(statsRes.data);
          if (attRes) setAttendees(attRes.data);
          if (waitRes) setWaitlist(waitRes.data);
          if (ticketsRes) setTickets(ticketsRes.data);
        } catch (err) {
          console.log("Could not load seat stats yet");
        }
      } catch (err) {
        console.error("Failed to load event", err);
        // Could be not found or unauthorized
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEvent();
  }, [id]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName || !price) return;
    
    setAddingCategory(true);
    try {
      const payload = {
        name: categoryName,
        price: parseFloat(price),
        capacity: parseInt(capacity) || 0,
        isStanding: false
      };
      
      const res = await api.post(`/events/${id}/categories`, payload);
      // Update local state to reflect new category
      setEvent((prev: any) => ({
        ...prev,
        ticketCategories: [...(prev.ticketCategories || []), res.data]
      }));
      
      // Reset form
      setCategoryName("");
      setPrice("");
      setCapacity("");
    } catch (error: any) {
      console.error("Failed to add category", error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
      toast.error(`Failed to add category: ${errorMsg}\nStatus: ${error.response?.status}`);
    } finally {
      setAddingCategory(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Event Not Found</h1>
      <Link href="/dashboard" className="text-primary hover:underline">Return to Dashboard</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2 text-foreground/60 hover:text-primary mb-4 transition-colors">
              <ArrowLeft size={20} />
              <span className="font-bold">Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
              {event?.title}
              <span className={`px-3 py-1 text-sm rounded-full ${new Date(event?.eventDate) < new Date() ? 'bg-secondary text-foreground/50' : 'bg-primary/10 text-primary'}`}>
                {new Date(event?.eventDate) < new Date() ? 'COMPLETED' : event?.status}
              </span>
            </h1>
            <p className="text-foreground/70">Manage your event settings, tickets, and see real-time analytics.</p>
          </div>
          
          <button onClick={() => setScannerOpen(true)} className="flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg hover:scale-105 w-full md:w-auto">
            <Scan size={20} />
            Scan Ticket QR
          </button>
        </div>

        <TicketScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <p className="text-foreground/70 text-lg flex items-center gap-2">
              📍 {event.venue} • 🕒 {new Date(event.eventDate).toLocaleDateString()}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full border text-sm font-black uppercase tracking-wider ${
            new Date(event.eventDate) < new Date() ? 'bg-secondary text-foreground/50 border-border' :
            event.status === 'PUBLISHED' || event.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
            event.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
            'bg-amber-500/10 text-amber-500 border-amber-500/20'
          }`}>
            {new Date(event.eventDate) < new Date() ? 'COMPLETED' : event.status || 'PENDING'}
          </div>
        </div>

        {/* --- Event Specific Dashboards --- */}
        <div className="mb-12 space-y-8">
          <BookingStatsChart attendees={attendees} event={event} />

          <div className="grid md:grid-cols-2 gap-8">
            {/* Event Specific Check-ins Table */}
            <div className="glass-card p-8 rounded-3xl border border-border">
              <div className="flex justify-between items-center mb-6 border-b border-border pb-6">
                <h2 className="text-xl font-black flex items-center gap-2"><Ticket className="text-primary"/> Check-In Status</h2>
                <div className="text-xs font-bold bg-secondary/50 px-3 py-1.5 rounded-xl">
                  {tickets.filter(t => t.isCheckedIn).length} / {tickets.length} Checked In
                </div>
              </div>
              
              {tickets.length === 0 ? (
                <div className="text-center py-12 text-foreground/50">
                  No tickets have been generated yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 text-foreground/60 text-xs uppercase tracking-wider">
                        <th className="p-3 font-bold">Attendee</th>
                        <th className="p-3 font-bold">Ticket Type</th>
                        <th className="p-3 font-bold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {tickets.map((t: any, idx: number) => (
                        <tr key={idx} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                          <td className="p-3 font-medium">
                            {t.booking?.user?.name || 'Unknown'}
                            <div className="text-xs text-foreground/60 font-normal">{t.booking?.user?.email}</div>
                          </td>
                          <td className="p-3">
                            <span className="bg-secondary px-2 py-1 rounded text-xs border border-border">{t.ticketCategory?.name}</span>
                            {t.isGroupTicket && <span className="ml-2 text-[10px] text-orange-500 font-bold">GROUP</span>}
                          </td>
                          <td className="p-3 text-center">
                            {t.isCheckedIn ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full text-[10px] font-bold border border-emerald-500/20">
                                <CheckCircle2 size={10}/> IN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-secondary text-foreground/50 px-2 py-1 rounded-full text-[10px] font-bold border border-border/50">
                                PENDING
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Event Specific Waitlist */}
            <div className="glass-card p-8 rounded-3xl border border-border">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2 border-b border-border pb-6">
                <Users size={20} className="text-amber-500" /> Waitlist Queue
                <span className="ml-auto bg-amber-500/10 text-amber-500 text-xs px-2 py-1 rounded-full">{waitlist.length}</span>
              </h3>
              
              {waitlist.length === 0 ? (
                <div className="text-center py-12 text-foreground/50 text-sm">
                  Queue is currently empty.
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {waitlist.map((w: any, i: number) => (
                    <div key={i} className="flex flex-col p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">User: {w.user?.name || w.user?.email || 'Unknown'}</span>
                        <span className="text-xs text-foreground/60 font-bold bg-background px-2 py-1 rounded">Pos: {w.position}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 truncate max-w-[150px]">
                          Waiting for slot
                        </span>
                        {w.notifiedAt ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">Notified</span>
                        ) : (
                          <span className="text-amber-500 font-semibold flex items-center gap-1">Waiting</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>


        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Event Details & Ticket Categories */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 rounded-3xl border border-border">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b border-border pb-4">
                <Ticket className="text-primary" /> Ticket Categories
              </h2>
              
              {!event.ticketCategories || event.ticketCategories.length === 0 ? (
                <div className="text-center py-10 text-foreground/50 bg-secondary/30 rounded-2xl border border-dashed border-border mb-8">
                  <Ticket size={48} className="opacity-20 mx-auto mb-4" />
                  <p className="text-lg font-medium">No ticket categories yet</p>
                  <p className="text-sm">Create categories like VIP or General Admission below.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {event.ticketCategories.map((cat: any) => (
                    <div key={cat.id} className="flex flex-col p-5 bg-secondary/50 rounded-2xl border border-border/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-lg mb-1">{cat.name}</h4>
                          <p className="text-sm text-foreground/60 flex items-center gap-3">
                            <span className="flex items-center gap-1"><DollarSign size={14}/> Rs. {cat.price}</span>
                            <span className="flex items-center gap-1"><Users size={14}/> Capacity: {cat.capacity}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Category Form */}
              {event.isTicketed && (
                <div className="bg-background rounded-2xl border border-border p-6 relative mb-8">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-2xl"></div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Settings size={18} className="text-primary"/> Add New Category
                  </h3>
                  <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="relative flex-1 w-full">
                      <label className="block text-xs font-bold mb-1.5 text-foreground/70">Category Name</label>
                      <input 
                        type="text" 
                        required
                        value={categoryName}
                        onChange={e => setCategoryName(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="e.g. VIP"
                        className="w-full p-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none text-sm"
                      />
                      {showSuggestions && (
                        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                          {["VIP", "VVIP", "General Admission", "Early Bird", "Balcony", "Box", "Student Pass", "Group Offer"]
                            .filter(cat => cat.toLowerCase().includes(categoryName.toLowerCase()))
                            .map((cat, idx) => (
                              <div 
                                key={idx} 
                                className="p-3 text-sm hover:bg-secondary cursor-pointer"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Prevent blur from firing first
                                  setCategoryName(cat);
                                  setShowSuggestions(false);
                                }}
                              >
                                {cat}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="w-full sm:w-28 shrink-0">
                      <label className="block text-xs font-bold mb-1.5 text-foreground/70">Capacity</label>
                      <input 
                        type="number" 
                        min="1"
                        required
                        value={capacity}
                        onChange={e => setCapacity(e.target.value)}
                        placeholder="e.g. 100"
                        className="w-full p-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none text-sm"
                      />
                    </div>
                    <div className="w-full sm:w-32 shrink-0">
                      <label className="block text-xs font-bold mb-1.5 text-foreground/70">Price (Rs.)</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        required
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none text-sm"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={addingCategory}
                      className="w-full sm:w-auto px-6 h-[46px] bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {addingCategory ? "..." : "Add"}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column: Event Info Summary */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-transparent">
              <h3 className="font-bold mb-4">Event Details</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-foreground/50 font-semibold mb-1">Category</p>
                  <p className="font-medium">{event.category}</p>
                </div>
                <div>
                  <p className="text-foreground/50 font-semibold mb-1">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {event.tags?.map((t: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-background rounded-md border border-border text-xs">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-foreground/50 font-semibold mb-1">Description</p>
                  <p className="line-clamp-4 leading-relaxed">{event.description}</p>
                </div>
              </div>
            </motion.div>
            
            {seatStats && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-3xl border border-border bg-secondary/20">
                <h3 className="font-bold mb-4 text-primary flex items-center gap-2">
                  <GridIcon size={18} /> Venue Statistics
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-background border border-border">
                    <span className="text-foreground/70 flex items-center gap-2"><span className="text-lg">🪑</span> Standalone Chairs</span>
                    <span className="font-black text-lg">{seatStats.standaloneChairs}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-background border border-border">
                    <span className="text-foreground/70 flex items-center gap-2"><span className="text-lg">🔲</span> Tables</span>
                    <span className="font-black text-lg">{seatStats.tables}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <span className="flex items-center gap-2 font-semibold"><span className="text-lg">🪑</span> Chairs at Tables</span>
                    <span className="font-black text-lg">{seatStats.tableChairs}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-background border border-border">
                    <span className="text-foreground/70 flex items-center gap-2"><span className="text-lg">🧍</span> Standing Zones</span>
                    <span className="font-black text-lg">{seatStats.standingZones}</span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                    <span className="font-bold text-foreground/50">Total Bookable Seats</span>
                    <span className="font-black text-2xl text-primary">
                      {seatStats.standaloneChairs + seatStats.tableChairs + seatStats.standingZones}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Visual Seat Editor takes full width at the bottom */}
        {event.isTicketed && (
          <div className="mt-12 mb-12">
            <VisualSeatEditor eventId={id as string} ticketCategories={event.ticketCategories || []} />
          </div>
        )}

      </div>
    </div>
  );
}
