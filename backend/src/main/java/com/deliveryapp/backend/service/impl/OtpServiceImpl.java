package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.dto.LoginResult;
import com.deliveryapp.backend.entity.ActiveToken;
import com.deliveryapp.backend.entity.MobileOtp;
import com.deliveryapp.backend.entity.Token;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.exception.InvalidOtpException;
import com.deliveryapp.backend.exception.OtpExpiredException;
import com.deliveryapp.backend.exception.OtpRateLimitException;
import com.deliveryapp.backend.exception.TooManyOtpAttemptsException;
import com.deliveryapp.backend.repository.ActiveTokenRepository;
import com.deliveryapp.backend.repository.MobileOtpRepository;
import com.deliveryapp.backend.repository.TokenRepository;
import com.deliveryapp.backend.repository.UserRepository;
import com.deliveryapp.backend.security.JwtUtil;
import com.deliveryapp.backend.service.OtpService;
import com.deliveryapp.backend.service.SnsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class OtpServiceImpl implements OtpService {

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 3;
    /**
     * Minimum seconds that must pass before a new OTP can be sent to the same
     * number
     */
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    private final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    private MobileOtpRepository mobileOtpRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TokenRepository tokenRepository;
    @Autowired
    private ActiveTokenRepository activeTokenRepository;
    @Autowired
    private SnsService snsService;
    @Autowired
    private JwtUtil jwtUtil;

    // ---------------------------------------------------------------
    // Send OTP
    // ---------------------------------------------------------------
    @Override
    @Transactional
    public void sendOtp(String mobileNumber, String name) {
        // Rate-limiting: reject if a non-expired OTP was sent within the cooldown
        // window
        Optional<MobileOtp> recent = mobileOtpRepository
                .findTopByMobileNumberAndVerifiedFalseOrderByCreatedAtDesc(mobileNumber);

        if (recent.isPresent()) {
            MobileOtp existing = recent.get();
            boolean stillWithinCooldown = existing.getCreatedAt()
                    .plusSeconds(RESEND_COOLDOWN_SECONDS)
                    .isAfter(LocalDateTime.now());
            if (stillWithinCooldown && existing.getExpiresAt().isAfter(LocalDateTime.now())) {
                throw new OtpRateLimitException(
                        "Please wait " + RESEND_COOLDOWN_SECONDS +
                                " seconds before requesting a new OTP.");
            }
        }

        // Generate secure 6-digit OTP
        String otpCode = String.format("%06d", secureRandom.nextInt(1_000_000));

        // Persist OTP record (store name so it's available at verify-otp time)
        MobileOtp otp = new MobileOtp();
        otp.setMobileNumber(mobileNumber);
        otp.setOtpCode(otpCode);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        otp.setAttemptCount(0);
        otp.setVerified(false);
        if (name != null && !name.isBlank()) {
            otp.setName(name);
        }
        mobileOtpRepository.save(otp);

        // Send SMS via AWS SNS — OTP is intentionally NOT included in any API response
        String messageText = "Your OTP is: " + otpCode +
                ". It is valid for " + OTP_EXPIRY_MINUTES + " minutes. Do not share it with anyone.";
        snsService.sendSms(mobileNumber, messageText);
    }

    // ---------------------------------------------------------------
    // Verify OTP and issue JWT
    // ---------------------------------------------------------------
    @Override
    @Transactional
    public LoginResult verifyOtpAndLogin(String mobileNumber, String otpCode, String clientType, String name) {
        // Load the most recent OTP for this number
        MobileOtp otp = mobileOtpRepository
                .findTopByMobileNumberOrderByCreatedAtDesc(mobileNumber)
                .orElseThrow(() -> new InvalidOtpException(
                        "No OTP found for this mobile number. Please request a new OTP."));

        // Check if already verified (replay attack prevention)
        if (Boolean.TRUE.equals(otp.getVerified())) {
            throw new InvalidOtpException("This OTP has already been used. Please request a new OTP.");
        }

        // Check expiry
        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new OtpExpiredException("OTP has expired. Please request a new OTP.");
        }

        // Enforce max attempts before checking code
        int currentAttempts = otp.getAttemptCount() == null ? 0 : otp.getAttemptCount();
        if (currentAttempts >= MAX_ATTEMPTS) {
            throw new TooManyOtpAttemptsException(
                    "Maximum verification attempts exceeded. Please request a new OTP.");
        }

        // Increment attempt count
        otp.setAttemptCount(currentAttempts + 1);

        // Validate OTP code
        if (!otp.getOtpCode().equals(otpCode)) {
            mobileOtpRepository.save(otp); // persist incremented attempt count
            int remaining = MAX_ATTEMPTS - otp.getAttemptCount();
            throw new InvalidOtpException(
                    "Invalid OTP. "
                            + (remaining > 0 ? remaining + " attempt(s) remaining." : "No attempts remaining."));
        }

        // Mark as verified
        otp.setVerified(true);
        mobileOtpRepository.save(otp);

        // Resolve name: prefer verify-otp param > send-otp param > fallback 'Customer'
        String resolvedName = (name != null && !name.isBlank()) ? name
                : (otp.getName() != null && !otp.getName().isBlank()) ? otp.getName()
                : "Customer";

        // Find or create CUSTOMER user
        Optional<User> existingUser = userRepository.findByMobile(mobileNumber);
        boolean isNewUser = existingUser.isEmpty();

        User user = existingUser.orElseGet(() -> {
            User newUser = new User();
            newUser.setMobile(mobileNumber);
            newUser.setName(resolvedName);
            newUser.setRole("CUSTOMER");
            newUser.setActive(true);
            newUser.setStatus("ACTIVE");
            return userRepository.save(newUser);
        });

        // Generate JWT — subject is the mobile number for customer OTP logins
        String jwtToken = jwtUtil.generateToken(mobileNumber, "CUSTOMER", clientType);

        // Persist token records
        persistToken(user, jwtToken, clientType);

        return new LoginResult(jwtToken, isNewUser, user.getName());
    }

    private void persistToken(User user, String token, String clientType) {
        Token tokenEntity = new Token();
        tokenEntity.setUserId(user.getId());
        tokenEntity.setAccessToken(token);
        tokenEntity.setIpAddress("OTP-Login");
        tokenEntity.setIssuedAt(LocalDateTime.now());
        
        // Use client-specific expiration for DB persistence
        long expMs = "WEBSITE".equalsIgnoreCase(clientType) ? 12L * 60 * 60 * 1000 : 5L * 24 * 60 * 60 * 1000;
        tokenEntity.setExpiresAt(LocalDateTime.now().plusNanos(expMs * 1_000_000));
        
        tokenEntity.setCreatedAt(LocalDateTime.now());
        Token savedToken = tokenRepository.save(tokenEntity);

        ActiveToken activeToken = new ActiveToken();
        activeToken.setUserId(user.getId());
        activeToken.setTokenId(savedToken.getId());
        activeToken.setIsActive(true);
        activeToken.setLastUsedAt(LocalDateTime.now());
        activeToken.setCreatedAt(LocalDateTime.now());
        activeTokenRepository.save(activeToken);
    }
}
