"use client";

import { useState } from "react";
import Link from "next/link";

export default function BusinessPortalPage() {
  const [formData, setFormData] = useState({
    applicantName: "",
    name: "",
    description: "",
    category: "hotel",
    region: "",
    city: "",
    address: "",
    permitNumber: "",
    contactPhone: "",
    contactEmail: "",
    industryDetails: {} as Record<string, string>,
    industryFiles: {} as Record<string, File | null>,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        industryFiles: { ...formData.industryFiles, [e.target.name]: e.target.files[0] },
      });
    }
  };
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleIndustryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      industryDetails: { ...formData.industryDetails, [e.target.name]: e.target.value },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("applicantName", formData.applicantName);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("region", formData.region);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("permitNumber", formData.permitNumber);
      formDataToSend.append("contactPhone", formData.contactPhone);
      formDataToSend.append("contactEmail", formData.contactEmail);
      
      // Serialize industryDetails as a string (it contains metadata)
      formDataToSend.append("industryDetails", JSON.stringify(formData.industryDetails));

      // Append actual files
      Object.entries(formData.industryFiles).forEach(([key, file]) => {
        if (file) {
          formDataToSend.append(`file_${key}`, file);
        }
      });

      const res = await fetch("/api/businesses/apply", {
        method: "POST",
        body: formDataToSend, // Send as form data, no headers needed for boundary
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        setSuccess(
          "Business registration submitted successfully! It will be reviewed by a Tourism Admin. You will receive an email once approved."
        );
        setFormData({
          applicantName: "",
          name: "",
          description: "",
          category: "hotel",
          region: "",
          city: "",
          address: "",
          permitNumber: "",
          contactPhone: "",
          contactEmail: "",
          industryDetails: {},
          industryFiles: {},
        });
        // Reset file inputs because browser doesn't clear them automatically on state reset
        const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
        fileInputs.forEach(input => { input.value = ''; });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white text-[14px] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300";

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Ambient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/[0.06]">
        <div className="glass">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-lg font-extrabold tracking-tight gradient-text">
                WONDAR ETHIOPIA
              </Link>
              <span className="text-gray-800">|</span>
              <span className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">
                Business Portal
              </span>
            </div>
            <Link
              href="/"
              className="px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-white hover:bg-white/[0.04] rounded-lg transition-all"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="animate-fade-in mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" />
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-600">
              Business Application
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Register Your Business
          </h1>
          <p className="text-[15px] text-gray-600">
            Submit your details for review. A Tourism Admin will evaluate your registration
            and you&apos;ll receive login credentials via email upon approval.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 p-5 rounded-xl border border-white/[0.06]">
          <div className="flex items-center justify-between text-center">
            {[
              { step: "1", label: "Submit Application", active: true },
              { step: "2", label: "Tourism Admin Review", active: false },
              { step: "3", label: "Super Admin Approval", active: false },
              { step: "4", label: "Get Credentials", active: false },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center gap-3 flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${
                      s.active
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 text-black"
                        : "border border-white/[0.08] text-gray-600"
                    }`}
                  >
                    {s.step}
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      s.active ? "text-amber-400" : "text-gray-700"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < 3 && (
                  <div className="h-px w-full bg-white/[0.04] hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-elevated rounded-2xl p-8 shadow-2xl shadow-black/50 animate-slide-up" style={{ opacity: 0, animationDelay: "0.1s" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/[0.08] border border-red-500/20 rounded-xl p-3.5 text-red-400 text-[13px] font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/[0.08] border border-green-500/20 rounded-xl p-4 text-green-400 text-[13px] font-medium">
                <span className="text-lg block mb-1">🎉</span>
                {success}
              </div>
            )}

            {/* Applicant Name */}
            <div>
              <label htmlFor="applicantName" className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Your Full Name *
              </label>
              <input
                id="applicantName" name="applicantName" type="text"
                value={formData.applicantName} onChange={handleChange} required
                className={inputClass} placeholder="John Doe"
              />
            </div>

            {/* Business Name + Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Business Name *
                </label>
                <input
                  id="name" name="name" type="text"
                  value={formData.name} onChange={handleChange} required
                  className={inputClass} placeholder="Ethiopian Adventures"
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Category *
                </label>
                <select
                  id="category" name="category"
                  value={formData.category} onChange={handleChange}
                  className={inputClass}
                >
                  <option value="hotel">Hotel</option>
                  <option value="tour_operator">Tour Operator</option>
                  <option value="car_rental">Car Rental</option>
                  <option value="event_organizer">Event Organizer</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Description *
              </label>
              <textarea
                id="description" name="description"
                value={formData.description} onChange={handleChange}
                required rows={3} className={inputClass}
                placeholder="Describe your business, services, and what makes it unique..."
              />
            </div>

            {/* Location */}
            <div>
              <span className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
                📍 Location
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  name="region" type="text" value={formData.region}
                  onChange={handleChange} required className={inputClass}
                  placeholder="Region (e.g. Amhara)"
                />
                <input
                  name="city" type="text" value={formData.city}
                  onChange={handleChange} required className={inputClass}
                  placeholder="City (e.g. Gondar)"
                />
                <input
                  name="address" type="text" value={formData.address}
                  onChange={handleChange} required className={inputClass}
                  placeholder="Address"
                />
              </div>
            </div>

            {/* Permit + Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="permitNumber" className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Permit Number *
                </label>
                <input
                  id="permitNumber" name="permitNumber" type="text"
                  value={formData.permitNumber} onChange={handleChange} required
                  className={inputClass} placeholder="BIZ-2024-001"
                />
              </div>
              <div>
                <label htmlFor="contactPhone" className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Contact Phone *
                </label>
                <input
                  id="contactPhone" name="contactPhone" type="text"
                  value={formData.contactPhone} onChange={handleChange} required
                  className={inputClass} placeholder="+251 9xx xxx xxx"
                />
              </div>
            </div>

            {/* Dynamic Industry Questions */}
            <div className="py-2">
              <span className="block text-[12px] font-semibold text-amber-500/80 uppercase tracking-widest mb-4">
               Industry Related Information ({formData.category.replace("_", " ")})
              </span>
              <div className="space-y-4">
                {formData.category === "hotel" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <select name="stars" onChange={handleIndustryChange} className={inputClass}>
                        <option value="">Select Stars</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                      </select>
                      <input name="website" type="text" placeholder="Hotel Website" onChange={handleIndustryChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase mb-2">Upload Hotel License (PDF/Image)</label>
                      <input name="hotelLicense" type="file" onChange={handleFileChange} className={inputClass} accept=".pdf,image/*" />
                    </div>
                  </>
                )}
                {formData.category === "car_rental" && (
                  <>
                    <input name="insurance" type="text" placeholder="Insurance Provider Name" onChange={handleIndustryChange} className={inputClass} />
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase mb-2">Upload Fleet Management License</label>
                      <input name="rentalLicense" type="file" onChange={handleFileChange} className={inputClass} accept=".pdf,image/*" />
                    </div>
                  </>
                )}
                {formData.category === "tour_operator" && (
                  <>
                    <input name="languages" type="text" placeholder="Languages Supported" onChange={handleIndustryChange} className={inputClass} />
                    <input name="specialization" type="text" placeholder="Specialization (e.g. Hiking, Cultural)" onChange={handleIndustryChange} className={inputClass} />
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase mb-2">Upload Tour Operator Certificate</label>
                      <input name="tourCert" type="file" onChange={handleFileChange} className={inputClass} accept=".pdf,image/*" />
                    </div>
                  </>
                )}
                {formData.category === "restaurant" && (
                  <>
                    <input name="cuisine" type="text" placeholder="Cuisine Type" onChange={handleIndustryChange} className={inputClass} />
                    <input name="capacity" type="number" placeholder="Seating Capacity" onChange={handleIndustryChange} className={inputClass} />
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase mb-2">Upload Health & Safety Permit</label>
                      <input name="healthPermit" type="file" onChange={handleFileChange} className={inputClass} accept=".pdf,image/*" />
                    </div>
                  </>
                )}
                {formData.category === "event_organizer" && (
                  <>
                    <input name="eventTypes" type="text" placeholder="Types of Events (Wedding, Corporate, etc.)" onChange={handleIndustryChange} className={inputClass} />
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase mb-2">Upload Event Planning Permit</label>
                      <input name="eventPermit" type="file" onChange={handleFileChange} className={inputClass} accept=".pdf,image/*" />
                    </div>
                  </>
                )}
                {formData.category === "other" && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-2">Upload Your Business License / Permit</label>
                    <input name="otherLicense" type="file" onChange={handleFileChange} className={inputClass} accept=".pdf,image/*" />
                  </div>
                )}
              </div>
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="contactEmail" className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Contact Email * <span className="text-[10px] text-gray-700 normal-case tracking-normal">(login credentials will be sent here)</span>
              </label>
              <input
                id="contactEmail" name="contactEmail" type="email"
                value={formData.contactEmail} onChange={handleChange} required
                className={inputClass} placeholder="info@yourbusiness.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-black text-[14px] font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>
        </div>

        {/* Help text */}
        <div className="mt-6 text-center">
          <p className="text-[13px] text-gray-700">
            Already have an account?{" "}
            <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
