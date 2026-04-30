import React, { useState, useEffect } from "react";
import { User, Mail, Check } from "lucide-react";
import { updateUserProfile, sendLinkPhoneOtp, verifyLinkPhoneOtp } from "../api";

export default function GoogleCompleteProfileModal({ phone: initialPhone = "", email: initialEmail = "", name: initialName = "", token, initialProfile = {}, onComplete }) {
  const [name, setName] = useState(initialName || initialProfile.name || "");
  const [email, setEmail] = useState(initialEmail || initialProfile.email || "");
  const [phone, setPhone] = useState(initialPhone || initialProfile.phone || "");
  const [gender, setGender] = useState(initialProfile.gender || "");
  const [dob, setDob] = useState(initialProfile.dob || "");
  const [saving, setSaving] = useState(false);
  
  const [phoneVerified, setPhoneVerified] = useState(!!initialPhone || !!initialProfile.phone);
  const [otpStage, setOtpStage] = useState("idle"); // 'idle', 'sent'
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialName) setName(initialName);
    if (initialEmail) setEmail(initialEmail);
    if (initialPhone) setPhone(initialPhone);
  }, [initialName, initialEmail, initialPhone]);

  const handleSendOtp = async (e) => {
    e && e.preventDefault();
    if (!phone.trim() || phone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit phone number.");
      return;
    }
    setOtpLoading(true);
    setErrorMsg("");
    try {
      const formattedPhone = `+91${phone.replace(/\D/g, "")}`;
      await sendLinkPhoneOtp(token, { mobileNumber: formattedPhone });
      setOtpStage("sent");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to send OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e && e.preventDefault();
    if (otp.length < 4) {
      setErrorMsg("Please enter a valid OTP.");
      return;
    }
    setOtpLoading(true);
    setErrorMsg("");
    try {
      const formattedPhone = `+91${phone.replace(/\D/g, "")}`;
      await verifyLinkPhoneOtp(token, { mobileNumber: formattedPhone, otpCode: otp });
      setPhoneVerified(true);
      setOtpStage("idle");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Invalid OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!name.trim() || !email.trim() || !gender || !dob || !phone.trim() || phone.length < 10) {
        alert("Please fill all fields to complete your profile.");
        return;
    }
    if (!phoneVerified) {
        alert("Please verify your mobile number before saving.");
        return;
    }

    setSaving(true);
    const finalPhone = initialProfile?.phone || `+91${phone.replace(/\D/g, "")}`;
    const payload = { 
        name: name.trim(), 
        email: email.trim(), 
        gender, 
        dob,
        mobile: finalPhone,
        mobileNumber: finalPhone,
        mobile_number: finalPhone,
        phoneNumber: finalPhone,
        phone_number: finalPhone,
        phone: finalPhone
    };
    
    try {
      await updateUserProfile(token, payload);
      onComplete && onComplete({ ...payload, phone: finalPhone });
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      <form
        onSubmit={handleSubmit}
        className="relative bg-white w-full max-w-md mx-4 rounded-xl shadow-lg p-6 border border-gray-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <User size={18} /> Complete Your Profile
        </h3>
        
        <p className="text-sm text-gray-500 mb-4">Please complete your profile details to continue.</p>

        <label className="block text-sm text-gray-600">Full name</label>
        <div className="mt-1 mb-3">
          <input
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-200 ${!!initialName ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
            readOnly={!!initialName}
          />
        </div>

        <label className="block text-sm text-gray-600">Email</label>
        <div className="mt-1 mb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="email"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-200 ${!!initialEmail ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                required
                readOnly={!!initialEmail}
              />
            </div>
            {!!initialEmail && (
              <span className="px-3 py-2 text-sm font-medium text-emerald-600 flex items-center gap-1 flex-shrink-0">
                <Check size={16} /> Verified
              </span>
            )}
          </div>
        </div>

        <label className="block text-sm text-gray-600">Mobile number</label>
        <div className="mt-1 mb-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">+91</span>
                <input
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-200 ${phoneVerified ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                  maxLength={10}
                  required
                  readOnly={phoneVerified || otpStage === "sent"}
                />
              </div>
              {!phoneVerified && otpStage === "idle" && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || phone.length < 10}
                  className="px-4 py-2 flex-shrink-0 bg-emerald-100 text-emerald-700 font-medium rounded-md hover:bg-emerald-200 disabled:opacity-50"
                >
                  {otpLoading ? "Sending..." : "Verify"}
                </button>
              )}
              {phoneVerified && (
                <span className="px-3 py-2 text-sm font-medium text-emerald-600 flex items-center gap-1 flex-shrink-0">
                  <Check size={16} /> Verified
                </span>
              )}
            </div>
            {otpStage === "sent" && !phoneVerified && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-200"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || otp.length < 4}
                  className="px-3 py-2 flex-shrink-0 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {otpLoading ? "Verifying..." : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setOtpStage("idle")}
                  disabled={otpLoading}
                  className="px-3 py-2 flex-shrink-0 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
            {errorMsg && <p className="text-red-500 text-sm mt-1">{errorMsg}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm text-gray-600">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-200"
              required
            >
              <option value="">Select Gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-200"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-60"
          >
            <Check size={16} />
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
