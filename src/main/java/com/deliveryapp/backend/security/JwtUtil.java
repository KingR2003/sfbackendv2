package com.deliveryapp.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    private static final Key SECRET_KEY = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    
    // Expiration times in milliseconds
    private static final long MOBILE_EXP = 5L * 24 * 60 * 60 * 1000; // 5 days
    private static final long WEBSITE_EXP = 30L * 60 * 1000;        // 30 mins
    private static final long ADMIN_WEB_EXP = 5L * 60 * 1000;       // 5 mins (inactivity limit)

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public String extractClientType(String token) {
        return extractClaim(token, claims -> claims.get("clientType", String.class));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(SECRET_KEY).build().parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(String username, String role) {
        return generateToken(username, role, "MOBILE"); // Default
    }

    public String generateToken(String username, String role, String clientType) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("clientType", clientType);
        return createToken(claims, username, clientType);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    private String createToken(Map<String, Object> claims, String subject, String clientType) {
        long expiration = getExpirationForClient(clientType);
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    private long getExpirationForClient(String clientType) {
        if ("WEBSITE".equalsIgnoreCase(clientType)) {
            return WEBSITE_EXP;
        } else if ("ADMIN_WEB".equalsIgnoreCase(clientType)) {
            return ADMIN_WEB_EXP;
        }
        return MOBILE_EXP;
    }

    public Boolean validateToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }
}
