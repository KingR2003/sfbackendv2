import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { googleAuth } from "../api";

const GoogleAuthButton = ({ onSuccess, onError, isLoading = false }) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      setLoading(true);
      setError("");
      try {
        // Send the ID token to the backend
        const response = await googleAuth({
          idToken: credentialResponse.id_token,
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

        // Extract user details
        const user = {
          name: resData.user?.name || resData.data?.user?.name || resData.name || "",
          email: resData.user?.email || resData.data?.user?.email || resData.email || "",
          phone: resData.user?.phone || resData.data?.user?.phone || resData.phone || "",
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
    },
    onError: () => {
      const errorMessage = "Google login failed. Please try again.";
      setError(errorMessage);
      onError && onError(errorMessage);
    },
    flow: "implicit",
  });

  return (
    <div className="google-auth-wrapper">
      <button
        onClick={() => googleLogin()}
        disabled={isLoading || loading}
        className="google-auth-btn"
      >
        <svg
          className="google-icon"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="matrix(1, 0, 0, 1, 27.009766, -39.238281)">
            <path
              fill="#4285F4"
              d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
            />
            <path
              fill="#34A853"
              d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
            />
            <path
              fill="#FBBC05"
              d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
            />
            <path
              fill="#EA4335"
              d="M -14.754 43.989 C -13.044 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
            />
          </g>
        </svg>
        <span>{loading ? "Signing in..." : "Google"}</span>
      </button>
      {error && <p className="auth-error">{error}</p>}

      <style>{`
        .google-auth-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .google-auth-btn {
          width: 100%;
          max-width: 360px;
          padding: 16px;
          border: 1px solid #dadce0;
          border-radius: 12px;
          background-color: #ffffff;
          color: #202124;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .google-auth-btn:hover:not(:disabled) {
          background-color: #f8f9fa;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        }

        .google-auth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .google-icon {
          width: 20px;
          height: 20px;
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
