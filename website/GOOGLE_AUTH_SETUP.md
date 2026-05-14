# Google Authentication Implementation Guide

## Overview
Google authentication has been implemented for both sign-in and account creation. The system now supports signing in/registering with a Google account via `POST /api/v1/auth/google` endpoint.

## Files Modified

### 1. **src/apiConfig.js**
- Added Google authentication endpoint: `GOOGLE_AUTH: /api/v1/auth/google`

### 2. **src/api.jsx**
- Added `googleAuth()` function to send ID token to backend
- Extracts and returns JWT token and user information from response

### 3. **src/components/GoogleAuthButton.jsx** (NEW)
- Reusable Google authentication button component
- Uses `@react-oauth/google` library for OAuth flow
- Handles token extraction and error management
- Styled to match your app's design system

### 4. **src/components/AuthPage.jsx**
- Integrated GoogleAuthButton component
- Replaces placeholder Google button with functional component
- Maps Google auth result to existing OTP verification handler

### 5. **src/main.jsx**
- Wrapped App with `GoogleOAuthProvider`
- Loads Google Client ID from environment variable

### 6. **package.json**
- Added dependency: `@react-oauth/google`

## Setup Instructions

### Step 1: Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Choose "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - Your production domain
7. Add authorized redirect URIs:
   - `http://localhost:5173`
   - Your production domain
8. Copy your **Client ID** (format: `xxx.apps.googleusercontent.com`)

### Step 2: Add Google Client ID to Your App

#### Option A: Environment Variable (Recommended)
Create a `.env` file in your project root:
```
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

Then restart your dev server:
```bash
npm run dev
```

#### Option B: Direct Configuration
Edit `src/main.jsx` and replace:
```javascript
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE'
```

### Step 3: Backend Implementation

Your backend needs to implement the `POST /api/v1/auth/google` endpoint:

#### Request Format:
```json
POST /api/v1/auth/google
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ..."
}
```

#### Expected Response:
```json
{
  "token": "JWT_TOKEN_HERE",
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91XXXXXXXXXX"
  },
  "isNew": false
}
```

#### Backend Steps:
1. **Verify ID Token**: Use Google's client library to verify the idToken
   - Validate signature
   - Check expiration
   - Verify Client ID matches

2. **Extract Claims**: Get user info from token
   ```
   - sub (userId)
   - email
   - name
   - picture (optional)
   ```

3. **User Management**:
   - Check if user exists by email
   - If new user: Create account with Google provided info
   - If existing: Handle as sign-in
   - Set `isNew: true` if account was just created

4. **Generate JWT**: Create your app's JWT token for the user

5. **Return Response**: Include token and user details

#### Example Backend Verification (Node.js/Express):
```javascript
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

app.post('/api/v1/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;
    
    // Find or create user
    let user = await User.findOne({ email });
    const isNew = !user;
    
    if (!user) {
      user = await User.create({
        email,
        name,
        googleId
      });
    }
    
    // Generate JWT
    const token = generateJWT(user);
    
    // Return response
    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone || ''
      },
      isNew
    });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
});
```

## How It Works

### User Flow:

1. **User clicks "Sign in with Google" button**
   - GoogleAuthButton triggers Google login flow via `@react-oauth/google`

2. **Google OAuth Dialog Opens**
   - User selects/signs in with their Google account
   - Grants permission to app

3. **ID Token Received**
   - Frontend captures the `id_token` from Google's response
   - Sends to backend via `POST /api/v1/auth/google`

4. **Backend Verification**
   - Verifies token signature with Google
   - Extracts user information
   - Creates account if first-time user
   - Returns JWT token

5. **Frontend Stores Token**
   - Calls `onOTPVerified` handler (same as OTP flow)
   - Stores JWT in localStorage/state
   - Redirects to dashboard

## Token Response Handling

The `GoogleAuthButton` component handles multiple response formats from the backend:

```javascript
// All these formats are supported:
resData.token
resData.data?.token
resData.user?.token
resData.data?.user?.token
resData.accessToken
resData.data?.accessToken
resData.jwt
resData.data?.jwt
```

User information extraction:
```javascript
resData.user?.name || resData.data?.user?.name || resData.name
resData.user?.email || resData.data?.user?.email || resData.email
resData.user?.phone || resData.data?.user?.phone || resData.phone
```

## Styling

GoogleAuthButton comes with built-in styling that includes:
- Google brand colors (blue, red, yellow, green)
- Responsive design
- Hover and disabled states
- Error message display

To customize styling, edit the `<style jsx>` block in [GoogleAuthButton.jsx](src/components/GoogleAuthButton.jsx)

## Error Handling

The component catches and displays errors:
- Invalid tokens
- Network failures
- Backend rejections
- Google OAuth failures

Errors are shown in red below the button and logged to console with `[Google Auth]` prefix.

## Testing

1. Start your dev server: `npm run dev`
2. Navigate to auth page
3. Click "Sign in with Google"
4. Complete Google authentication
5. Check browser console for logs with `[Google Auth]` prefix
6. Verify JWT token is received and stored

## Troubleshooting

### Issue: "YOUR_GOOGLE_CLIENT_ID_HERE" error
- **Solution**: Add valid Google Client ID to either `.env` file or directly in `src/main.jsx`

### Issue: CORS errors
- **Solution**: Ensure your backend is properly configured to accept requests from your frontend domain

### Issue: Token verification fails on backend
- **Solution**: 
  - Verify Client ID matches in both frontend and backend
  - Check token isn't expired
  - Ensure Google API client library is installed

### Issue: Google button doesn't appear
- **Solution**: 
  - Check GoogleOAuthProvider is wrapping your App in main.jsx
  - Verify @react-oauth/google is installed: `npm list @react-oauth/google`
  - Check browser console for errors

## Security Notes

1. **Never expose Client Secret**: Only use Client ID (which is public)
2. **Always verify on backend**: Never trust frontend token verification
3. **Use HTTPS in production**: Required for OAuth
4. **Store tokens securely**: Use HTTP-only cookies if possible, or secure storage
5. **Set token expiration**: Implement refresh tokens for long-lived sessions

## Next Steps

1. Get your Google OAuth credentials
2. Implement backend endpoint
3. Test the flow
4. Deploy to production with valid redirect URIs
