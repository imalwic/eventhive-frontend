"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Ticket, Star, Crown, CreditCard, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axios";

declare global {
  interface Window {
    payhere: any;
  }
}

const packages = [
  {
    name: "BASIC",
    price: 10000,
    durationMonths: 6,
    maxEvents: 2,
    icon: <Ticket className="text-blue-500" size={32} />,
    color: "blue",
    features: ["Create up to 2 Events", "Valid for 6 Months", "Standard Support"]
  },
  {
    name: "STANDARD",
    price: 25000,
    durationMonths: 12,
    maxEvents: 6,
    icon: <Star className="text-purple-500" size={32} />,
    color: "purple",
    popular: true,
    features: ["Create up to 6 Events", "Valid for 1 Year", "Priority Support", "Featured Listing"]
  },
  {
    name: "PRO",
    price: 50000,
    durationMonths: 24,
    maxEvents: -1,
    icon: <Crown className="text-yellow-500" size={32} />,
    color: "yellow",
    features: ["Unlimited Events", "Valid for 2 Years", "24/7 Dedicated Support", "Premium Analytics"]
  }
];

export default function PackagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');
  
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'BANK_TRANSFER'>('CARD');

  useEffect(() => {
    if (planParam) {
      const pkg = packages.find(p => p.name.toLowerCase() === planParam.toLowerCase());
      if (pkg) setSelectedPackage(pkg);
    } else {
      setSelectedPackage(null);
    }
  }, [planParam]);

  const handleSelectPackage = (pkg: any) => {
    router.push(`/dashboard/organizer/packages?plan=${pkg.name.toLowerCase()}`);
  };

  const handleBackToPackages = () => {
    router.push('/dashboard/organizer/packages');
  };
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("packageName", selectedPackage.name);
    formData.append("price", selectedPackage.price.toString());
    formData.append("maxEvents", selectedPackage.maxEvents.toString());
    formData.append("durationMonths", selectedPackage.durationMonths.toString());
    formData.append("paymentMethod", paymentMethod);
    
    if (paymentMethod === 'BANK_TRANSFER' && paymentSlip) {
      formData.append("paymentSlip", paymentSlip);
    }

    try {
      const res = await api.post("/subscriptions/purchase", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (paymentMethod === 'CARD') {
        const subId = res.data.id;
        const hashRes = await api.get(`/payments/generate-hash/subscription/${subId}`);
        const { merchant_id, order_id, amount, currency, hash } = hashRes.data;

        const payment = {
          sandbox: true,
          merchant_id: merchant_id,
          return_url: window.location.origin + "/dashboard",
          cancel_url: window.location.origin + "/dashboard/organizer/packages",
          notify_url: "http://localhost:8080/api/payments/notify", 
          order_id: order_id,
          items: selectedPackage.name + " Package",
          amount: Number(amount).toFixed(2),
          currency: currency,
          hash: hash,
          first_name: "Event",
          last_name: "Organizer",
          email: "organizer@eventhive.com",
          phone: "0771234567",
          address: "No.1, Galle Road",
          city: "Colombo",
          country: "Sri Lanka",
        };

        window.payhere.onCompleted = async function (completedOrderId: string) {
          // Simulate the webhook since localhost cannot receive real webhooks from PayHere
          try {
            const formData = new URLSearchParams();
            formData.append("merchant_id", merchant_id);
            formData.append("order_id", completedOrderId);
            formData.append("payhere_amount", Number(amount).toFixed(2));
            formData.append("payhere_currency", currency);
            formData.append("status_code", "2"); // 2 = success
            formData.append("md5sig", "SIMULATED_HASH");

            await api.post("/payments/notify", formData, {
              headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });
            
            toast.success("Payment completed successfully!");
            window.location.href = "/dashboard";
          } catch (e) {
            toast.error("Payment completed but failed to update status locally.");
          }
        };

        window.payhere.onDismissed = function () {
          toast.error("Payment was dismissed");
          setLoading(false);
        };

        window.payhere.onError = function (error: any) {
          toast.error("Payment error: " + error);
          setLoading(false);
        };

        window.payhere.startPayment(payment);
      } else {
        toast.success("Payment slip uploaded successfully! Admin will verify and activate your package soon.");
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to process request.");
      setLoading(false);
    }
  };

  if (selectedPackage) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto py-12 px-6">
        <button onClick={handleBackToPackages} className="text-sm font-bold text-primary mb-6 hover:underline flex items-center gap-1">
          &larr; Back to Packages
        </button>
        <div className="glass-card p-8 rounded-3xl border border-border">
          <h2 className="text-3xl font-black mb-2">Checkout</h2>
          <p className="text-foreground/60 mb-8">Complete your purchase for the {selectedPackage.name} package.</p>
          
          <div className="bg-secondary/30 p-6 rounded-2xl mb-8 flex justify-between items-center border border-border">
            <div>
              <p className="font-bold text-lg">{selectedPackage.name} Package</p>
              <p className="text-sm text-foreground/60">{selectedPackage.maxEvents === -1 ? 'Unlimited' : selectedPackage.maxEvents} Events • {selectedPackage.durationMonths} Months</p>
            </div>
            <p className="text-2xl font-black">LKR {selectedPackage.price.toLocaleString()}</p>
          </div>

          <form onSubmit={handlePurchase} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-4">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${paymentMethod === 'CARD' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-secondary/50 hover:bg-secondary'}`}
                >
                  <CreditCard size={24} />
                  <span className="font-bold text-sm">Online Card Payment</span>
                </div>
                <div 
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${paymentMethod === 'BANK_TRANSFER' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-secondary/50 hover:bg-secondary'}`}
                >
                  <Upload size={24} />
                  <span className="font-bold text-sm">Bank Transfer Slip</span>
                </div>
              </div>
            </div>

            {paymentMethod === 'CARD' ? (
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl text-center">
                <p className="text-sm font-semibold text-primary mb-2">Secure Online Payment (PayHere)</p>
                <p className="text-xs text-foreground/60">Clicking Pay Now will redirect you to the secure PayHere checkout.</p>
              </div>
            ) : (
              <div className="bg-secondary/50 p-6 rounded-2xl border border-border">
                <p className="text-sm font-bold mb-2">Bank Details:</p>
                <p className="text-xs text-foreground/60 mb-4 font-mono bg-background p-3 rounded-lg border border-border">
                  Bank: Commercial Bank<br/>
                  Account Name: EventHive Platform<br/>
                  Account No: 1234567890<br/>
                  Branch: Colombo
                </p>
                <label className="block text-sm font-bold mb-2">Upload Payment Slip</label>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={(e) => setPaymentSlip(e.target.files?.[0] || null)}
                  required 
                  className="w-full p-2 border border-border rounded-xl text-sm"
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Pay LKR ${selectedPackage.price.toLocaleString()}`}
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto py-12 px-6">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black mb-4">Choose Your Plan</h1>
        <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
          Scale your events with our tailored packages. Get exactly what you need to make your next event a massive success.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-center">
        {packages.map((pkg, idx) => (
          <div 
            key={pkg.name} 
            className={`glass-card rounded-3xl p-8 border relative transition-transform hover:-translate-y-2 ${pkg.popular ? 'border-primary shadow-[0_0_40px_-15px_rgba(255,51,102,0.3)] md:-translate-y-4 md:hover:-translate-y-6' : 'border-border'}`}
          >
            {pkg.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase shadow-lg">
                Most Popular
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${pkg.color}-500/10`}>
                {pkg.icon}
              </div>
              <div>
                <h3 className="font-black text-xl">{pkg.name}</h3>
                <p className="text-sm text-foreground/50">{pkg.durationMonths} Months Access</p>
              </div>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-black">LKR {pkg.price.toLocaleString()}</span>
            </div>

            <ul className="space-y-4 mb-8">
              {pkg.features.map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 size={18} className={pkg.popular ? 'text-primary' : 'text-foreground/40'} />
                  {feat}
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleSelectPackage(pkg)}
              className={`w-full py-3 rounded-xl font-bold transition-all ${pkg.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-foreground hover:bg-foreground hover:text-background'}`}
            >
              Get Started
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
