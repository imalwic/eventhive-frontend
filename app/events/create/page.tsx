"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { CalendarPlus, MapPin, Tag, Type, ArrowLeft, Sparkles, Image as ImageIcon, Loader2, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [error, setError] = useState("");
  
  // AI States
  const [aiGenerating, setAiGenerating] = useState(false);
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    venue: "",
    eventDate: "",
    category: "Concert",
    isTicketed: true,
    tags: ""
  });

  useEffect(() => {
    const checkSub = async () => {
      try {
        const res = await api.get("/subscriptions/current");
        const sub = res.data;
        if (!sub) {
          router.push("/dashboard/organizer/packages");
        } else if (sub.status === "REJECTED") {
          toast.error("Your previous payment was rejected. Please purchase a valid package.");
          router.push("/dashboard/organizer/packages");
        } else if (sub.status === "PENDING") {
          setSubStatus("PENDING");
          setCheckingLimit(false);
        } else if (sub.status === "ACTIVE" && sub.maxEvents !== -1 && sub.eventsUsed >= sub.maxEvents) {
          router.push("/dashboard/organizer/packages");
        } else {
          setSubStatus("ACTIVE");
          setCheckingLimit(false);
        }
      } catch (err) {
        console.error("Failed to check subscription", err);
        setCheckingLimit(false);
      }
    };
    checkSub();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAIGenerate = async () => {
    if (!formData.title || !formData.venue) {
      toast.error("Please enter a Title and Venue first so the AI knows what to write about!");
      return;
    }

    setAiGenerating(true);
    let generatedDesc = "";
    
    try {
      // 1. Generate Description & Tags
      const res = await api.post("/ai/enrich-event", {
        title: formData.title,
        category: formData.category,
        venue: formData.venue
      });
      
      generatedDesc = res.data.result;
      
      // Auto-fill form
      setFormData(prev => ({
        ...prev,
        description: generatedDesc,
        // Optional: The AI could return tags, but for now we'll just set description
      }));
    } catch (err) {
      console.error("Failed to generate description", err);
      toast.error("Failed to generate AI description.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const tagsList = formData.tags.split(',').map(t => t.trim()).filter(t => t !== "");
      const eventPayload = {
        ...formData,
        tags: tagsList,
        eventDate: formData.eventDate ? new Date(formData.eventDate).toISOString().slice(0, 19) : "",
        // Pass ai properties if your entity supports them (venueImageUrl, aiGeneratedDesc)
        aiGeneratedDesc: formData.description, 
      };

      const res = await api.post("/events/create", eventPayload);
      const newEventId = res.data.id;

      if (eventImage) {
        const formDataUpload = new FormData();
        formDataUpload.append("image", eventImage);
        await api.post(`/events/${newEventId}/image`, formDataUpload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      toast.success("Event created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Failed to create event", err);
      if (err.response?.status === 403) {
        toast.error(err.response?.data?.message || "Subscription limit reached.");
        router.push("/dashboard/organizer/packages");
      } else {
        setError(err.response?.data?.message || "Failed to create event. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingLimit) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary w-12 h-12" />
    </div>
  );

  if (subStatus === "PENDING") return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-12 rounded-3xl max-w-lg w-full flex flex-col items-center border border-border">
        <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-6">
          <Clock size={40} />
        </div>
        <h1 className="text-3xl font-black mb-4">Payment Pending</h1>
        <p className="text-foreground/60 mb-8 leading-relaxed">
          Your payment is currently awaiting admin verification. You will be able to create events once your package is activated.
        </p>
        <Link href="/dashboard" className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all">
          Return to Dashboard
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors mb-8 font-semibold">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            <CalendarPlus className="text-primary" size={36} />
            Create New Event
          </h1>
          <p className="text-foreground/70">Fill in the details below to publish your next amazing experience.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 rounded-3xl border border-border">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl mb-6 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                  <Type size={16} /> Event Title
                </label>
                <input 
                  type="text" 
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="E.g., Acoustic Night 2026"
                  className="w-full p-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                  <Tag size={16} /> Category
                </label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                >
                  <option value="Concert">Concert</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Conference">Conference</option>
                  <option value="Sports">Sports</option>
                  <option value="Meetup">Meetup</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                  <MapPin size={16} /> Venue
                </label>
                <input 
                  type="text" 
                  name="venue"
                  required
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="E.g., Viharamahadevi Open Air Theater"
                  className="w-full p-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/80">Date & Time</label>
                <input 
                  type="datetime-local" 
                  name="eventDate"
                  required
                  value={formData.eventDate}
                  onChange={handleChange}
                  className="w-full p-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-text dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <div className="p-5 bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/20 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                  <Sparkles size={16} className="text-primary"/> AI Description & Layout Magic
                </label>
                <button 
                  type="button" 
                  onClick={handleAIGenerate}
                  disabled={aiGenerating}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {aiGenerating ? "Writing Description..." : "Auto-Generate with AI"}
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <textarea 
                  name="description"
                  required
                  rows={8}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell attendees what to expect... Or click the magic button!"
                  className="w-full p-4 rounded-2xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-sm"
                ></textarea>
                
                <div className="h-full min-h-[200px] bg-secondary/50 border border-border rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEventImage(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Event Venue" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4 text-foreground/60 group-hover:text-primary transition-colors">
                      <ImageIcon size={32} className="mx-auto mb-2" />
                      <p className="text-xs font-bold">Upload Event Image</p>
                      <p className="text-[10px] opacity-70 mt-1">Click or drag & drop</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80">Tags (Comma separated)</label>
              <input 
                type="text" 
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="E.g., music, live, rock"
                className="w-full p-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-2xl border border-border/50">
              <input 
                type="checkbox" 
                name="isTicketed"
                id="isTicketed"
                checked={formData.isTicketed}
                onChange={handleChange}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
              <label htmlFor="isTicketed" className="font-semibold cursor-pointer select-none">
                This is a Ticketed Event (Requires Booking)
              </label>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button 
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:scale-100"
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
