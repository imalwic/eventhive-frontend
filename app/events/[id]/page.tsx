"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, Info, CheckCircle2, XCircle, Shield } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import Script from "next/script";

declare global {
  interface Window {
    payhere: any;
  }
}

interface Seat {
  id: number;
  seatNumber: string;
  tierName: string;
  seatType: string;
  xCoordinate: number;
  yCoordinate: number;
  price: number;
  status: "AVAILABLE" | "LOCKED" | "BOOKED";
  version: number;
}

interface EventDetails {
  id: number;
  title: string;
  description: string;
  venue: string;
  eventDate: string;
  seats: Seat[];
}

export default function EventPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [hoveredGroup, setHoveredGroup] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        const seatsRes = await api.get(`/seats/event/${id}`);
        
        // Map backend Seat entity names to frontend expected names
        const mappedSeats = seatsRes.data.map((s: any) => ({
          ...s,
          category: s.tierName,
          xCoord: s.xCoordinate,
          yCoord: s.yCoordinate
        }));

        setEvent({ ...res.data, seats: mappedSeats });
      } catch (err) {
        console.error("Failed to load event details", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEventDetails();
  }, [id]);

  const getGroupSeatIds = (seat: Seat): number[] => {
    let group = [seat.id];
    if (seat.seatType === "TABLE") {
      const surroundingChairs = event?.seats.filter(other => {
        if (other.seatType === "CHAIR") {
          const dx = Math.abs(other.xCoordinate - seat.xCoordinate);
          const dy = Math.abs(other.yCoordinate - seat.yCoordinate);
          return dx <= 1.5 && dy <= 1.5;
        }
        return false;
      }) || [];
      group = [seat.id, ...surroundingChairs.map(c => c.id)];
    } else if (seat.seatType === "CHAIR") {
      const parentTable = event?.seats.find(t => {
        if (t.seatType === "TABLE") {
          const dx = Math.abs(seat.xCoordinate - t.xCoordinate);
          const dy = Math.abs(seat.yCoordinate - t.yCoordinate);
          return dx <= 1.5 && dy <= 1.5;
        }
        return false;
      });
      
      if (parentTable) {
        const surroundingChairs = event?.seats.filter(other => {
          if (other.seatType === "CHAIR") {
            const dx = Math.abs(other.xCoordinate - parentTable.xCoordinate);
            const dy = Math.abs(other.yCoordinate - parentTable.yCoordinate);
            return dx <= 1.5 && dy <= 1.5;
          }
          return false;
        }) || [];
        group = [parentTable.id, ...surroundingChairs.map(c => c.id)];
      }
    }
    return group;
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== "AVAILABLE") return;
    
    const seatsToToggle = getGroupSeatIds(seat);

    const allSelected = seatsToToggle.every(id => selectedSeats.includes(id));
    
    if (allSelected) {
      setSelectedSeats(prev => prev.filter(s => !seatsToToggle.includes(s)));
    } else {
      setSelectedSeats(prev => {
        const newSelection = [...prev];
        seatsToToggle.forEach(id => {
          if (!newSelection.includes(id)) newSelection.push(id);
        });
        return newSelection;
      });
    }
  };

  const handleBook = async () => {
    if (selectedSeats.length === 0) return;
    setBookingLoading(true);
    
    try {
      // 1. Create a Booking (PENDING status on backend)
      const bookingRes = await api.post('/bookings/create', { 
        eventId: parseInt(id as string), 
        seatIds: selectedSeats 
      });
      const bookingId = bookingRes.data.id;

      // 2. Generate Payment Hash
      const hashRes = await api.get(`/payments/generate-hash/${bookingId}`);
      const paymentData = hashRes.data;

      // 3. Initiate PayHere Payment
      if (window.payhere) {
        window.payhere.onCompleted = async function onCompleted(orderId: any) {
          toast.success("Payment completed successfully! Generating tickets...");
          
          try {
            // Since we are on localhost, PayHere cannot reach our backend webhook.
            // We will manually trigger the notify endpoint to simulate the webhook.
            const formData = new FormData();
            formData.append('merchant_id', paymentData.merchant_id);
            formData.append('order_id', paymentData.order_id);
            formData.append('payhere_amount', paymentData.amount.toString());
            formData.append('payhere_currency', paymentData.currency);
            formData.append('status_code', '2'); // 2 means success
            formData.append('md5sig', 'dummy_sig'); 

            await api.post('/payments/notify', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success("Tickets generated and sent to email!");
            router.push("/dashboard");
          } catch (error) {
            console.error("Error generating tickets", error);
            toast.error("Payment successful but failed to generate tickets.");
            setBookingLoading(false);
          }
        };

        window.payhere.onDismissed = function onDismissed() {
          toast.error("Payment dismissed");
          setBookingLoading(false);
        };

        window.payhere.onError = function onError(error: any) {
          toast.error("Error occurred during payment");
          console.error(error);
          setBookingLoading(false);
        };

        const payment = {
          sandbox: true,
          merchant_id: paymentData.merchant_id,
          return_url: window.location.origin + "/dashboard",
          cancel_url: window.location.href,
          notify_url: "https://your-ngrok-url/api/payments/notify", // Backend Webhook URL
          order_id: paymentData.order_id,
          items: "Event Tickets: " + event.title,
          amount: paymentData.amount,
          currency: paymentData.currency,
          hash: paymentData.hash,
          first_name: "EventHive",
          last_name: "Customer",
          email: "customer@eventhive.com",
          phone: "0770000000",
          address: "Colombo",
          city: "Colombo",
          country: "Sri Lanka"
        };

        window.payhere.startPayment(payment);
      } else {
        toast.error("PayHere SDK not loaded. Refresh the page.");
        setBookingLoading(false);
      }

    } catch (err: any) {
      toast.error(err.response?.data || "Failed to initiate booking.");
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!event) return <div className="text-center py-20 text-xl font-bold">Event not found.</div>;

  const totalAmount = selectedSeats.reduce((sum, seatId) => {
    const seat = event.seats.find((s: any) => s.id === seatId);
    
    if (seat?.seatType === "TABLE") {
      // Find all selected chairs surrounding this table
      let surroundingChairsCount = 0;
      selectedSeats.forEach((otherSeatId: any) => {
        const otherSeat = event.seats.find((s: any) => s.id === otherSeatId);
        if (otherSeat?.seatType === "CHAIR") {
          const dx = Math.abs(otherSeat.xCoordinate - seat.xCoordinate);
          const dy = Math.abs(otherSeat.yCoordinate - seat.yCoordinate);
          if (dx <= 1.5 && dy <= 1.5) {
            surroundingChairsCount++;
          }
        }
      });
      // Special Offer: Buy N, Get 1 Free for the group
      if (surroundingChairsCount > 0) {
        return sum + (Math.max(0, surroundingChairsCount - 1) * (seat.price || 0));
      } else {
        return sum + (seat.price || 0); // Just the table itself if no chairs
      }
    } else if (seat?.seatType === "CHAIR") {
      const parentTable = event.seats.find((t: any) => 
        t.seatType === "TABLE" && 
        Math.abs(seat.xCoordinate - t.xCoordinate) <= 1.5 && 
        Math.abs(seat.yCoordinate - t.yCoordinate) <= 1.5
      );
      // If this chair belongs to a table that is also selected, it is already counted in the TABLE calculation
      if (parentTable && selectedSeats.includes(parentTable.id)) {
        return sum;
      }
    }
    
    return sum + (seat?.price || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Script src="https://www.payhere.lk/lib/payhere.js" strategy="lazyOnload" />
      {/* Event Header */}
      <div className="h-[40vh] bg-secondary relative overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10"></div>
        <div className="absolute inset-0 animated-gradient opacity-30"></div>
        
        <div className="container mx-auto px-6 relative z-20 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-6xl font-black mb-4">{event.title}</h1>
            <div className="flex flex-wrap gap-6 text-foreground/80 font-medium">
              <span className="flex items-center gap-2"><Calendar size={20} className="text-primary"/> {new Date(event.eventDate).toLocaleDateString()}</span>
              <span className="flex items-center gap-2"><Clock size={20} className="text-accent"/> {new Date(event.eventDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              <span className="flex items-center gap-2"><MapPin size={20} className="text-green-500"/> {event.venue}</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Details & Map */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Info className="text-primary" /> About Event</h2>
            <p className="text-foreground/70 leading-relaxed">{event.description}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Select Your Seats</h2>
            <div className="glass-card p-8 rounded-3xl overflow-x-auto relative min-h-[400px]">
              
              {(() => {
                const maxX = Math.max(...event.seats.map(s => s.xCoordinate || 0), 0);
                const maxY = Math.max(...event.seats.map(s => s.yCoordinate || 0), 0);
                const cellSize = 36; 
                const gap = 8;
                const gridWidth = (maxX + 1) * (cellSize + gap);
                const gridHeight = (maxY + 1) * (cellSize + gap);

                const getColorClass = (tierName: string) => {
                  if (!tierName) return "bg-primary border-primary text-primary-foreground";
                  const hash = tierName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const colors = [
                    "bg-blue-500/10 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white",
                    "bg-accent/10 border-accent text-accent hover:bg-accent hover:text-white",
                    "bg-purple-500/10 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white",
                    "bg-pink-500/10 border-pink-500 text-pink-600 hover:bg-pink-500 hover:text-white",
                    "bg-emerald-500/10 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                  ];
                  return colors[hash % colors.length];
                };

                return (
                  <div className="relative mx-auto" style={{ width: gridWidth, height: gridHeight }}>
                    {event.seats.map(seat => {
                      const isInfrastructure = seat.seatType === "STAGE" || seat.seatType === "WALKWAY";
                      const isBookable = !isInfrastructure;
                      const left = (seat.xCoordinate || 0) * (cellSize + gap);
                      const top = (seat.yCoordinate || 0) * (cellSize + gap);

                      if (isInfrastructure) {
                        return (
                          <div
                            key={seat.id}
                            className={`absolute flex items-center justify-center text-xs font-bold rounded-sm border-2 ${
                              seat.seatType === "STAGE" ? "bg-zinc-800 border-zinc-900 text-zinc-500" : "bg-gray-200 border-gray-300 border-dashed text-gray-400"
                            }`}
                            style={{ left, top, width: cellSize, height: cellSize }}
                            title={seat.seatType}
                          >
                            {seat.seatType === "STAGE" ? "🎤" : "👣"}
                          </div>
                        );
                      }

                      const isHovered = hoveredGroup.includes(seat.id);

                      return (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat)}
                          onMouseEnter={() => setHoveredGroup(getGroupSeatIds(seat))}
                          onMouseLeave={() => setHoveredGroup([])}
                          disabled={seat.status !== "AVAILABLE"}
                          className={`absolute rounded-t-lg rounded-b-sm border-2 flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                            seat.status === "BOOKED" ? "bg-foreground/10 border-foreground/20 text-foreground/30 cursor-not-allowed"
                            : selectedSeats.includes(seat.id) ? "bg-green-500 border-green-500 text-white shadow-green-500/50 scale-110 z-10"
                            : isHovered ? "bg-primary border-primary text-primary-foreground scale-110 z-10 shadow-primary/50" 
                            : getColorClass(seat.tierName)
                          }`}
                          style={{ left, top, width: cellSize, height: cellSize }}
                          title={`${seat.tierName || 'Standard'} - Rs.${seat.price}`}
                        >
                          {seat.seatType === "CHAIR" ? "🪑" : seat.seatType === "TABLE" ? "🔲" : "🧍"}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            
            <div className="flex gap-6 mt-6 text-sm text-foreground/70 justify-center flex-wrap">
              <span className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500/10 border-2 border-blue-500 rounded-sm"></div> Available Tier</span>
              <span className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 border-2 border-green-500 rounded-sm"></div> Selected</span>
              <span className="flex items-center gap-2"><div className="w-4 h-4 bg-foreground/10 border-2 border-foreground/20 rounded-sm"></div> Booked/Locked</span>
            </div>
          </section>
        </div>

        {/* Right Column: Checkout Sticky */}
        <div>
          <div className="sticky top-28 glass-card p-6 rounded-3xl border border-border shadow-xl">
            <h3 className="text-xl font-bold mb-4 border-b border-border pb-4">Booking Summary</h3>
            
            {selectedSeats.length === 0 ? (
              <div className="text-center py-8 text-foreground/50 flex flex-col items-center">
                <CheckCircle2 size={40} className="mb-2 opacity-20" />
                <p>Select seats from the map to proceed</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                  {selectedSeats.map(seatId => {
                    const seat = event.seats.find(s => s.id === seatId)!;
                    return (
                      <div key={seatId} className="flex justify-between items-center p-3 bg-secondary rounded-xl">
                        <div>
                          <p className="font-bold text-sm">Seat {seat.seatNumber}</p>
                          <p className="text-xs text-foreground/50">{seat.category}</p>
                        </div>
                        <p className="font-semibold text-sm">Rs. {seat.price}</p>
                      </div>
                    );
                  })}
                </div>
                
                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-foreground/70">Total Amount</p>
                    <p className="text-2xl font-black text-primary">Rs. {totalAmount}</p>
                  </div>
                  
                  <button 
                    onClick={handleBook}
                    disabled={bookingLoading}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center"
                  >
                    {bookingLoading ? "Processing..." : "Proceed to Checkout"}
                  </button>
                  <p className="text-xs text-center text-foreground/40 mt-4 flex items-center justify-center gap-1">
                    <Shield size={12}/> Secure Payment via PayHere
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
