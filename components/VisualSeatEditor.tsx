"use client";

import { useState, useEffect } from "react";
import { Eraser, Grid as GridIcon, Info } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";

interface VisualSeatEditorProps {
  eventId: string;
  ticketCategories: any[];
}

interface SeatPlacement {
  x: number;
  y: number;
  type: string; // CHAIR, TABLE, STANDING
  categoryId: number | null;
}

export default function VisualSeatEditor({ eventId, ticketCategories }: VisualSeatEditorProps) {
  const [selectedTool, setSelectedTool] = useState<string>("CHAIR");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    ticketCategories.length > 0 ? ticketCategories[0].id : null
  );
  
  const [placedSeats, setPlacedSeats] = useState<SeatPlacement[]>([]);
  const [saving, setSaving] = useState(false);

  // Define grid size state
  const [rows, setRows] = useState(15);
  const [cols, setCols] = useState(20);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchExistingSeats = async () => {
      try {
        const res = await api.get(`/seats/event/${eventId}`);
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map((seat: any) => ({
            x: seat.xCoordinate || 0,
            y: seat.yCoordinate || 0,
            type: seat.seatType || "CHAIR",
            categoryId: ticketCategories.find(c => c.name === seat.tierName)?.id || null
          }));
          setPlacedSeats(mapped);
          
          const maxX = Math.max(...mapped.map((s: any) => s.x || 0), 15);
          const maxY = Math.max(...mapped.map((s: any) => s.y || 0), 20);
          
          // Only update cols/rows if we found a valid number to prevent NaN
          if (!isNaN(maxX)) setCols(maxX + 2);
          if (!isNaN(maxY)) setRows(maxY + 2);
        }
      } catch (err) {
        console.error("Failed to fetch existing seats:", err);
      }
    };
    if (eventId && ticketCategories.length > 0) {
      fetchExistingSeats();
    }
  }, [eventId, ticketCategories]);

  const handleCellClick = (x: number, y: number) => {
    setPlacedSeats((prev) => {
      const filtered = prev.filter(s => s.x !== x || s.y !== y);
      if (selectedTool === "ERASER") {
        return filtered;
      } else {
        if (!selectedCategory && selectedTool !== "STAGE" && selectedTool !== "WALKWAY") {
          return prev;
        }
        return [...filtered, { 
          x, 
          y, 
          type: selectedTool, 
          categoryId: (selectedTool === "STAGE" || selectedTool === "WALKWAY") ? null : selectedCategory 
        }];
      }
    });
  };

  const handleMouseDown = (x: number, y: number) => {
    if (!selectedCategory && selectedTool !== "STAGE" && selectedTool !== "WALKWAY" && selectedTool !== "ERASER") {
      alert("Please select a Ticket Category first!");
      return;
    }
    setIsDragging(true);
    handleCellClick(x, y);
  };

  const handleMouseEnter = (x: number, y: number) => {
    if (isDragging) {
      handleCellClick(x, y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    if (placedSeats.length === 0) {
      toast.error("No seats placed on the grid!");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        eventId: parseInt(eventId),
        seats: placedSeats
      };
      await api.post("/seats/save-custom", payload);
      toast.success("Visual layout saved successfully! Attendees can now book these seats.");
    } catch (err) {
      console.error("Failed to save layout", err);
      toast.error("Failed to save layout. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getSeatColor = (categoryId: number | null, type: string) => {
    if (type === "STAGE") return "bg-zinc-800 border-zinc-900";
    if (type === "WALKWAY") return "bg-gray-200 border-gray-300 text-gray-800 border-dashed border-2";
    
    if (!categoryId) return "bg-gray-500";
    // Find category to generate a pseudo-random color or use a predefined list
    const index = ticketCategories.findIndex(c => c.id === categoryId);
    const colors = ["bg-emerald-500", "bg-primary", "bg-accent", "bg-purple-500", "bg-pink-500"];
    return colors[index % colors.length] || "bg-primary";
  };

  const renderGrid = () => {
    const grid = [];
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) {
        const seat = placedSeats.find(s => s.x === x && s.y === y);
        let cellClass = "w-6 h-6 border border-border/50 rounded-sm cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center text-[10px] select-none";
        
        let content = null;
        if (seat) {
          const color = getSeatColor(seat.categoryId, seat.type);
          cellClass += ` ${color} text-white shadow-sm`;
          
          if (seat.type === "CHAIR") content = "🪑";
          else if (seat.type === "TABLE") content = "🔲";
          else if (seat.type === "STANDING") content = "🧍";
          else if (seat.type === "STAGE") content = "🎤";
          else if (seat.type === "WALKWAY") content = "👣";
        } else {
          cellClass += " bg-secondary/20 hover:bg-secondary";
        }

        row.push(
          <div 
            key={`${x}-${y}`} 
            className={cellClass}
            onMouseDown={() => handleMouseDown(x, y)}
            onMouseEnter={() => handleMouseEnter(x, y)}
            title={seat ? `${seat.type} ${seat.categoryId ? '(' + ticketCategories.find(c => c.id === seat.categoryId)?.name + ')' : ''}` : `Empty (${x}, ${y})`}
          >
            {content}
          </div>
        );
      }
      grid.push(<div key={y} className="flex gap-1 mb-1">{row}</div>);
    }
    return grid;
  };

  return (
    <div 
      className="bg-background rounded-3xl border border-border p-6 shadow-xl relative overflow-hidden"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
      
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2 mb-2">
            <GridIcon className="text-primary" /> Visual Layout Editor
          </h2>
          <p className="text-sm text-foreground/60 flex items-center gap-1">
            <Info size={14}/> Click on the grid to paint your venue layout.
          </p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving || placedSeats.length === 0}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
        >
          {saving ? "Saving..." : "Save Layout to Database"}
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left Side: Toolbar */}
        <div className="w-full xl:w-64 space-y-6 shrink-0">
          <div className="p-4 bg-secondary/50 rounded-2xl border border-border">
            <h3 className="font-bold text-sm mb-3 opacity-70 uppercase tracking-wider">Venue Size</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-foreground/60">Rows (Depth)</label>
                <input 
                  type="number" 
                  min="5" 
                  max="100" 
                  value={rows} 
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full p-2 bg-background border border-border rounded-lg text-sm font-semibold outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-foreground/60">Cols (Width)</label>
                <input 
                  type="number" 
                  min="5" 
                  max="100" 
                  value={cols} 
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full p-2 bg-background border border-border rounded-lg text-sm font-semibold outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-secondary/50 rounded-2xl border border-border">
            <h3 className="font-bold text-sm mb-3 opacity-70 uppercase tracking-wider">1. Select Ticket Tier</h3>
            {ticketCategories.length === 0 ? (
              <p className="text-xs text-red-500 font-semibold">Please create a ticket category above first!</p>
            ) : (
              <select 
                className="w-full p-3 bg-background border border-border rounded-xl text-sm font-semibold outline-none"
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(parseInt(e.target.value))}
                disabled={selectedTool === "STAGE" || selectedTool === "WALKWAY"}
              >
                {ticketCategories.map((c, idx) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - Rs. {c.price}
                  </option>
                ))}
              </select>
            )}
            {(selectedTool === "STAGE" || selectedTool === "WALKWAY") && (
              <p className="text-[10px] text-foreground/50 mt-2">Ticket tiers do not apply to infrastructure.</p>
            )}
          </div>

          <div className="p-4 bg-secondary/50 rounded-2xl border border-border">
            <h3 className="font-bold text-sm mb-3 opacity-70 uppercase tracking-wider">2. Select Tool</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setSelectedTool("CHAIR")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all ${selectedTool === 'CHAIR' ? 'bg-primary/20 border-primary text-primary' : 'bg-background border-border hover:border-primary/50'}`}
              >
                <span className="text-xl">🪑</span> Chair
              </button>
              <button 
                onClick={() => setSelectedTool("TABLE")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all ${selectedTool === 'TABLE' ? 'bg-primary/20 border-primary text-primary' : 'bg-background border-border hover:border-primary/50'}`}
              >
                <span className="text-xl">🔲</span> Table
              </button>
              <button 
                onClick={() => setSelectedTool("STANDING")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all ${selectedTool === 'STANDING' ? 'bg-primary/20 border-primary text-primary' : 'bg-background border-border hover:border-primary/50'}`}
              >
                <span className="text-xl">🧍</span> Standing
              </button>
              <button 
                onClick={() => setSelectedTool("STAGE")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all ${selectedTool === 'STAGE' ? 'bg-zinc-800 text-white' : 'bg-background border-border hover:border-zinc-500'}`}
              >
                <span className="text-xl">🎤</span> Stage
              </button>
              <button 
                onClick={() => setSelectedTool("WALKWAY")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all ${selectedTool === 'WALKWAY' ? 'bg-gray-200 border-gray-400 text-gray-800' : 'bg-background border-border hover:border-gray-400'}`}
              >
                <span className="text-xl">👣</span> Walkway
              </button>
              <button 
                onClick={() => setSelectedTool("ERASER")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all ${selectedTool === 'ERASER' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-background border-border hover:border-red-500/50'}`}
              >
                <Eraser size={20} /> Eraser
              </button>
            </div>
          </div>

          <div className="p-4 bg-secondary/30 rounded-2xl border border-border text-xs text-foreground/70">
            <p className="font-bold mb-3 uppercase tracking-wider opacity-70">Live Grid Stats:</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>🪑 Chairs</span>
                <span className="font-bold">{placedSeats.filter(s => s.type === 'CHAIR').length}</span>
              </div>
              <div className="flex justify-between">
                <span>🔲 Tables</span>
                <span className="font-bold">{placedSeats.filter(s => s.type === 'TABLE').length}</span>
              </div>
              <div className="flex justify-between">
                <span>🧍 Standing</span>
                <span className="font-bold">{placedSeats.filter(s => s.type === 'STANDING').length}</span>
              </div>
              <div className="flex justify-between opacity-50 border-t border-border pt-2 mt-2">
                <span>🎤 Stage Blocks</span>
                <span className="font-bold">{placedSeats.filter(s => s.type === 'STAGE').length}</span>
              </div>
              <div className="flex justify-between opacity-50">
                <span>👣 Walkway Blocks</span>
                <span className="font-bold">{placedSeats.filter(s => s.type === 'WALKWAY').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Grid Canvas */}
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="min-w-max p-8 bg-secondary/10 rounded-2xl border-2 border-dashed border-border/50 inline-block relative">
            <div className="mt-2 p-4 bg-background rounded-xl border border-border shadow-inner">
              {renderGrid()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
