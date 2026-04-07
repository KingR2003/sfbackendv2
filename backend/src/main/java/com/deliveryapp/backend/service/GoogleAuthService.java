package com.deliveryapp.backend.service;

import com.deliveryapp.backend.dto.GoogleAuthRequest;
import com.deliveryapp.backend.dto.OtpResponse;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.Optional;

@Service
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final String googleClientId;
    private final String jwtSecret;
    private final long jwtExpiration;

    public GoogleAuthService(UserRepository userRepository,
                             @Value("${google.client-id}") String googleClientId,
                             @Value("${jwt.secret}") String jwtSecret,
                             @Value("${jwt.expiration}") long jwtExpiration) {
        this.userRepository = userRepository;
        this.googleClientId = googleClientId;
        this.jwtSecret = jwtSecret;
        this.jwtExpiration = jwtExpiration;
    }

    public OtpResponse loginWithGoogle(GoogleAuthRequest request) {
        try {
            // Step 1: Verify the Google ID token
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken == null) {
                return new OtpResponse(HttpStatus.UNAUTHORIZED.value(), "Invalid Google token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            // Step 2: Find existing user by email or googleId, or create new
            Optional<User> existingUser = userRepository.findByEmail(email);
            boolean isNewUser = false;
            User user;

            if (existingUser.isPresent()) {
                // Link Google ID to existing account if not already linked
                user = existingUser.get();
                if (user.getGoogleId() == null) {
                    user.setGoogleId(googleId);
                    user.setAuthProvider("GOOGLE");
                    userRepository.save(user);
                }
            } else {
                // Create a new user from Google profile
                user = new User();
                user.setName(name);
                user.setEmail(email);
                user.setGoogleId(googleId);
                user.setAuthProvider("GOOGLE");
                user.setRole("CUSTOMER");
                user.setActive(true);
                user.setStatus("ACTIVE");
                userRepository.save(user);
                isNewUser = true;
            }

            // Step 3: Generate your own JWT
            String jwt = generateJwt(user);

            return new OtpResponse(HttpStatus.OK.value(), "Login successful", jwt, isNewUser, user.getName());

        } catch (Exception e) {
            return new OtpResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Google login failed: " + e.getMessage());
        }
    }

    private String generateJwt(User user) {
        return Jwts.builder()
                .setSubject(user.getEmail() != null ? user.getEmail() : String.valueOf(user.getId()))
                .claim("role", user.getRole())
                .claim("userId", user.getId())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)),
                        SignatureAlgorithm.HS256)
                .compact();
    }
}
