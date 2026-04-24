package ru.fsp.casino.app.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import ru.fsp.casino.app.config.JwtProperties;
import ru.fsp.casino.domain.model.User;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;

@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;

    /**
     * HS256 (jjwt) требует ключ ≥ 256 бит. Строка короче 32 байт в UTF-8
     * детерминированно разворачивается в 32 байта через SHA-256 (удобно для dev/.env).
     */
    private SecretKey key() {
        byte[] raw = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        byte[] keyBytes = raw.length >= 32 ? raw : sha256(raw);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private static byte[] sha256(byte[] input) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(input);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getExpirationMs());
        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("username", user.getUsername())
            .claim("role", user.getRole().name())
            .issuedAt(now)
            .expiration(expiry)
            .signWith(key())
            .compact();
    }

    public Long extractUserId(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    public String extractUsername(String token) {
        return parseClaims(token).get("username", String.class);
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(key())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
