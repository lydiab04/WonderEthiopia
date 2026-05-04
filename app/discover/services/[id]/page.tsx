"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star, MapPin, ChevronLeft, Send, User, Calendar,
  MessageSquare, Phone, Mail, ShieldCheck, Clock,
  AlertTriangle, Loader2, Bed, Car, Compass, Building2, X, Globe
} from "lucide-react";
import { useSession } from "next-auth/react";

interface Service {
  _id: string;
  name: string;
  description: string;
  category: string[];
  price: number;
  currency: string;
  images: string[];
  metadata: Record<string, any>;
  businessId: {
    _id: string;
    name: string;
    location: { city: string; region: string; address: string };
    contactPhone: string;
    contactEmail: string;
    profilePicture?: string;
    description: string;
  };
}

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ServiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // Booking State
  const [bookingGuests, setBookingGuests] = useState(1);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [bookingNote, setBookingNote] = useState("");
  const [bookingStatus, setBookingStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fullSvcGallery, setFullSvcGallery] = useState<{ index: number } | null>(null);

  useEffect(() => {
    if (fullSvcGallery) {
      document.body.style.setProperty('overflow', 'hidden', 'important');
      document.documentElement.style.setProperty('overflow', 'hidden', 'important');
      document.body.style.setProperty('overscroll-behavior', 'none', 'important');
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      document.body.style.overscrollBehavior = 'auto';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      document.body.style.overscrollBehavior = 'auto';
    };
  }, [fullSvcGallery]);

  useEffect(() => {
    if (!id) return;

    async function fetchDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/services/${id}`);
        const data = await res.json();

        if (data.service) {
          setService(data.service);
          setReviews(data.reviews || []);
          setAvgRating(data.avgRating || 0);
        }
      } catch (error) {
        console.error("Failed to fetch service details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [id]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }

    if (!bookingDate) {
      setErrorMessage("Please select a date.");
      return;
    }

    // Validation: Arrival Date must be before Departure Dates (for tours)
    if (service?.metadata?.departureDates) {
      const depDateStr = String(service.metadata.departureDates);
      // Support YYYY-MM-DD and MM/DD/YYYY
      const dateMatches = depDateStr.match(/(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})/g);
      
      if (dateMatches && dateMatches.length > 0) {
        // Parse matches into timestamps for comparison
        const depTimestamps = dateMatches.map(d => new Date(d).getTime());
        const earliestDepTs = Math.min(...depTimestamps);
        
        // Normalize selected arrival date to midnight for accurate comparison
        const arrivalDate = new Date(bookingDate);
        arrivalDate.setHours(0, 0, 0, 0);
        const arrivalTs = arrivalDate.getTime();

        if (arrivalTs >= earliestDepTs) {
          const earliestDateObj = new Date(earliestDepTs);
          setErrorMessage(`Protocol Violation: Your arrival (${arrivalDate.toLocaleDateString()}) is after the scheduled departure (${earliestDateObj.toLocaleDateString()}). Please select an earlier arrival.`);
          return;
        }
      }
    }

    try {
      setBookingStatus("submitting");
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service?._id,
          startDate: bookingDate,
          endDate: bookingEndDate || undefined,
          guests: bookingGuests,
          specialRequests: bookingNote,
        }),
      });

      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        setBookingStatus("success");
        setTimeout(() => {
          window.location.href = data.checkoutUrl;
        }, 1500);
      } else {
        setErrorMessage(data.error || "Booking failed.");
        setBookingStatus("error");
      }
    } catch (error) {
      setErrorMessage("An error occurred.");
      setBookingStatus("error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl font-black mb-4">Service Not Found</h1>
        <Link href="/discover/businesses" className="text-primary font-bold">Return to Hub</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">


      <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-5 pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Left Column: Visuals & Description */}
          <div className="lg:col-span-7 space-y-12">
            {/* Gallery */}
            <div className="space-y-6">
              <div className="relative aspect-[16/10] rounded-[60px] overflow-hidden shadow-3xl shadow-primary/5 border border-foreground/5 cursor-pointer group" onClick={() => setFullSvcGallery({ index: activeImage })}>
                <Image
                  src={service.images[activeImage] || "/lalibela.png"}
                  alt={service.name}
                  fill
                  className="object-cover transition-all duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full glass border border-white/20 flex items-center justify-center text-white">
                    <Globe className="w-8 h-8" />
                  </div>
                </div>
                <div className="absolute top-8 left-8 flex gap-3 pointer-events-none">
                  {service.category.map((cat, idx) => (
                    <span key={idx} className="glass px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-primary border border-primary/10">
                      {cat.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {service.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-32 aspect-square rounded-[24px] overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary ring-4 ring-primary/10 scale-95' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <Image src={img} alt="Thumbnail" fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-10">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4">{service.name}</h1>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="font-black text-sm">{avgRating ? avgRating.toFixed(1) : "5.0"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/40 font-bold text-sm">
                    <Building2 className="w-4 h-4" /> Provided by {service.businessId.name}
                  </div>
                </div>
              </div>

              <div className="p-10 bg-surface-elevated/20 rounded-[50px] border border-foreground/[0.03]">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">Experience Strategy</h3>
                <p className="text-xl text-foreground/60 leading-relaxed font-medium whitespace-pre-line">
                  {service.description}
                </p>
              </div>

              {/* Structured Professional Specifications */}
              <div className="pt-8 space-y-16">
                {(() => {
                  const categories = service.category.map(c => c.toLowerCase());
                  const isStay = categories.some(c => ["hotel", "room", "suite", "stay", "accommodation", "resort"].includes(c));
                  const isCar = categories.some(c => ["car", "rental", "vehicle", "fleet", "transport"].includes(c));
                  const isEvent = categories.some(c => ["event", "organizer", "event_organizer"].includes(c));
                  const isTour = categories.some(c => ["tour", "expedition", "culture", "wildlife", "hiking", "trek", "trip"].includes(c));

                  const protocolGroups = [
                    // ACCOMMODATION GROUPS
                    {
                      id: "stay_core", label: "Accommodation Artifacts",
                      keys: ["accommodationType", "bedType", "maxOccupancy", "roomSize", "bathroomType", "viewType", "roomServiceAvailable", "accommodationPrice"],
                      active: isStay
                    },
                    {
                      id: "stay_culinary", label: "Culinary Portfolio",
                      keys: ["diningType", "cuisine", "priceRange", "reservationRequired"],
                      active: isStay
                    },
                    {
                      id: "stay_leisure", label: "Leisure & Recreation",
                      keys: ["facilityType", "accessType", "leisureHours", "equipmentAvailable"],
                      active: isStay
                    },
                    // FLEET GROUPS
                    {
                      id: "car_core", label: "Fleet Core Identity",
                      keys: ["vehicleName", "location", "features"],
                      active: isCar
                    },
                    {
                      id: "car_pricing", label: "Pricing & Deposit Protocol",
                      keys: ["pricingType", "depositAmount", "depositRequired"],
                      active: isCar
                    },
                    {
                      id: "car_specs", label: "Vehicle Specifications",
                      keys: ["brand", "model", "year", "luggageCapacity", "color"],
                      active: isCar
                    },
                    {
                      id: "car_personnel", label: "Driver & Personnel Options",
                      keys: ["withDriver", "driverIncludedPrice", "driverLanguages", "selfDriveAvailable"],
                      active: isCar
                    },
                    {
                      id: "car_logistics", label: "Fleet Logistics & Terms",
                      keys: ["fuelPolicy", "mileageLimit", "notAllowedUses"],
                      active: isCar
                    },
                    {
                      id: "car_safety", label: "Insurance & Safety Framework",
                      keys: ["insuranceType", "extraKmCharge", "safetyFeatures"],
                      active: isCar
                    },
                    // TOUR GROUPS
                    {
                      id: "tour_params", label: "Expedition Parameters",
                      keys: ["duration", "difficulty", "destinations", "tourType", "pricingType", "startLocation", "departureDates", "minGroupSize", "maxGroupSize", "requiredDocuments", "emergencyContact", "cancellationDeadline", "uniqueExperiences"],
                      active: isTour
                    }
                  ];

                  return (
                    <div className="space-y-16">
                      {protocolGroups.map(group => {
                        if (!group.active) return null;

                        const activeMeta = Object.entries(service.metadata || {})
                          .filter(([key]) => group.keys.includes(key) && service.metadata[key] !== "" && service.metadata[key] !== null);

                        if (activeMeta.length === 0) return null;

                        return (
                          <div key={group.id} className="animate-fade-in">
                            <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-primary mb-8 pb-3 border-b border-primary/10">
                              {group.label}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                              {activeMeta.map(([key, val]) => {
                                let displayVal = String(val);
                                if (typeof val === 'boolean') displayVal = val ? "Yes" : "No";

                                return (
                                  <div key={key} className="flex justify-between items-start gap-4 pb-4 border-b border-foreground/[0.03]">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/30 py-1">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span className="text-sm font-bold text-foreground/80 text-right capitalize">
                                      {displayVal}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Special Handling for Itinerary */}
                      {isTour && service.metadata.itinerary && service.metadata.itinerary.length > 0 && (
                        <div className="animate-fade-in pt-8">
                          <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-primary mb-10">Expedition Itinerary</h4>
                          <div className="space-y-8 pl-4 border-l-2 border-primary/10">
                            {service.metadata.itinerary.map((day: any, idx: number) => (
                              <div key={idx} className="relative pb-10 last:pb-0">
                                <div className="absolute left-[-21px] top-1.5 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm font-black text-primary">Day {day.day || idx + 1}</span>
                                    <div className="h-[1px] flex-1 bg-foreground/5" />
                                  </div>
                                  <p className="text-base font-medium text-foreground/60 leading-relaxed whitespace-pre-line">
                                    {day.activities}
                                  </p>
                                  {day.overnightStay && (
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-foreground/5 rounded-full text-[10px] font-bold text-foreground/40">
                                      <MapPin className="w-3 h-3" /> Stay: {day.overnightStay}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Right Column: Booking & Partner Info */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 space-y-8">

              {/* Booking Card */}
              <div className="glass shadow-3xl shadow-primary/10 p-10 rounded-[60px] border border-primary/10 animate-slide-up">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-1">Service Value</div>
                    <div className="text-3xl font-black text-primary">{service.currency} {service.price.toLocaleString()}</div>
                  </div>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/10">
                    <Calendar className="w-7 h-7" />
                  </div>
                </div>

                <form onSubmit={handleSubmitBooking} className="space-y-8">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-end mb-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-4">Arrival Date</label>
                        {service?.metadata?.departureDates && (
                          <span className="text-[9px] font-bold text-primary italic mr-4">Must be before {service.metadata.departureDates}</span>
                        )}
                      </div>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        max={(() => {
                           if (!service?.metadata?.departureDates) return undefined;
                           const depDateStr = String(service.metadata.departureDates);
                           const dateMatches = depDateStr.match(/(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})/g);
                           if (dateMatches && dateMatches.length > 0) {
                             const depTimestamps = dateMatches.map(d => new Date(d).getTime());
                             const earliestDepTs = Math.min(...depTimestamps);
                             const maxDate = new Date(earliestDepTs - 86400000); // 1 day before
                             return maxDate.toISOString().split('T')[0];
                           }
                           return undefined;
                        })()}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-foreground/[0.03] border-none focus:ring-2 ring-primary/20 rounded-3xl py-5 px-8 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-4">Travelers / Units</label>
                      <input
                        type="number"
                        min="1"
                        value={bookingGuests}
                        onChange={(e) => setBookingGuests(parseInt(e.target.value))}
                        className="w-full bg-foreground/[0.03] border-none focus:ring-2 ring-primary/20 rounded-3xl py-5 px-8 font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-4">Mission Directives (Optional)</label>
                    <textarea
                      placeholder="Any specific requests or requirements..."
                      value={bookingNote}
                      onChange={(e) => setBookingNote(e.target.value)}
                      className="w-full bg-foreground/[0.03] border-none focus:ring-2 ring-primary/20 rounded-3xl py-5 px-8 font-medium text-sm h-32 resize-none"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-4 bg-red-500/5 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-3 border border-red-500/10">
                      <AlertTriangle className="w-4 h-4" /> {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={bookingStatus === "submitting" || bookingStatus === "success"}
                    className="w-full bg-foreground text-background py-6 rounded-3xl text-sm font-black uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:bg-foreground/50"
                  >
                    {bookingStatus === "submitting" ? (
                      <>Finalizing Reservation <Loader2 className="w-5 h-5 animate-spin" /></>
                    ) : bookingStatus === "success" ? (
                      <>Reservation Secured <ShieldCheck className="w-5 h-5" /></>
                    ) : (
                      <>Secure This Reservation <Send className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></>
                    )}
                  </button>
                </form>
              </div>

              {/* Provider Info Card */}
              <Link href={`/discover/businesses/${service.businessId._id}`} className="block group">
                <div className="bg-surface-elevated/40 p-8 rounded-[48px] border border-foreground/5 hover:border-primary/20 transition-all flex items-center gap-6">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src={service.businessId.profilePicture || "/lalibela.png"}
                      alt={service.businessId.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Partner Entity</div>
                    <div className="font-bold text-foreground/80 group-hover:text-primary transition-colors">{service.businessId.name}</div>
                    <div className="text-[10px] font-medium text-foreground/40">{service.businessId.location.city}, {service.businessId.location.region}</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-32 pt-20 border-t border-foreground/5 space-y-12">
          <div className="flex items-end justify-between">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">Public Feedback</h2>
              <p className="text-foreground/40 font-bold uppercase text-[10px] tracking-[0.3em]">Verified experience reports</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.length === 0 ? (
              <div className="col-span-full py-20 bg-foreground/[0.02] rounded-[40px] border border-dashed border-foreground/5 text-center text-foreground/20 italic font-bold">
                No reports submitted for this specific service yet.
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="bg-white p-10 rounded-[40px] border border-foreground/[0.03] shadow-lg shadow-black/[0.02]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">{review.userId.name}</div>
                        <div className="text-[10px] font-medium text-foreground/30">{new Date(review.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'opacity-20'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-base text-foreground/60 leading-relaxed font-medium">"{review.comment}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
