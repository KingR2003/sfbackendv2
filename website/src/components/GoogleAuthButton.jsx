import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { googleAuth } from "../api";

const GoogleAuthButton = ({ onSuccess, onError, isLoading = false }) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      // ✅ CORRECT WAY: Google returns the token inside 'credentialResponse.credential'
      // We MUST map it to 'idToken' for the backend!
      const response = await googleAuth({
        idToken: credentialResponse.credential,
      });

      // Extract JWT token from response
      const resData = response.data || {};
      const token =
        resData.token ||
        resData.data?.token ||
        resData.user?.token ||
        resData.data?.user?.token ||
        resData.accessToken ||
        resData.data?.accessToken ||
        resData.jwt ||
        resData.data?.jwt ||
        null;

      // Decode Google JWT to get fallback user details (e.g. email, name)
      let googlePayload = {};
      try {
        const payloadBase64 = credentialResponse.credential.split('.')[1];
        if (payloadBase64) {
          const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          googlePayload = JSON.parse(jsonPayload);
        }
      } catch (e) {
        console.warn("[Google Auth] Could not decode JWT:", e);
      }

      // Extract user details
      const user = {
        name: resData.user?.name || resData.data?.user?.name || resData.name || googlePayload.name || "",
        email: resData.user?.email || resData.data?.user?.email || resData.email || googlePayload.email || "",
        phone: resData.user?.phone || resData.data?.user?.phone || resData.phone || "",
        gender: resData.user?.gender || resData.data?.user?.gender || resData.gender || "",
        dob: resData.user?.dob || resData.data?.user?.dob || resData.dob || "",
      };

      console.log("[Google Auth] Success:", { token: token?.substring(0, 20) + "...", user });

      // Call parent success handler
      onSuccess && onSuccess({
        token,
        user,
        isSignUp: resData.isNew || resData.data?.isNew || false,
        fullResponse: resData,
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Google authentication failed";
      setError(errorMessage);
      console.error("[Google Auth] Error:", errorMessage);
      onError && onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    const errorMessage = "Google login failed. Please try again.";
    setError(errorMessage);
    onError && onError(errorMessage);
  };

  return (
    <div className="google-auth-wrapper">
      <div className="google-login-container">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="outline"
          size="large"
          width={360}
          text="signin_with"
        />
      </div>
      {error && <p className="auth-error">{error}</p>}

      <style>{`
        .google-auth-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .google-login-container {
          width: 100%;
          max-width: 360px;
          display: flex;
          justify-content: center;
          overflow: hidden;
          height: 52px;
        }

        .google-login-container > div {
          width: 100% !important;
          max-width: 360px !important;
          height: 52px !important;
          overflow: hidden !important;
        }

        .google-login-container > div > div {
          width: 100% !important;
          height: 52px !important;
        }

        .google-login-container > div > div:not(:first-child) {
          display: none !important;
        }

        .google-login-container button,
        .google-login-container iframe {
          width: 100% !important;
          max-width: 360px !important;
          height: 52px !important;
          min-height: 52px !important;
          box-sizing: border-box !important;
        }

        .google-login-container button:hover {
          background-color: #f8f9fa !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12) !important;
        }

        .auth-error {
          color: #d32f2f;
          font-size: 14px;
          text-align: center;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default GoogleAuthButton;
