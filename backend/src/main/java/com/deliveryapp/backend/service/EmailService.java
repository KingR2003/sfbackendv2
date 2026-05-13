package com.deliveryapp.backend.service;

public interface EmailService {

    /**
     * Sends a support reply email to the customer.
     *
     * @param toEmail     Customer's email address
     * @param ticketId    The ticket ID for reference
     * @param subject     The original ticket subject
     * @param adminName   Name of the admin replying
     * @param replyText   The reply content
     */
    void sendSupportReply(String toEmail, String ticketId, String subject, String adminName, String replyText);

    /**
     * Sends a password reset link to the admin's email.
     *
     * @param toEmail    Admin's email address
     * @param adminName  Admin's name for personalization
     * @param resetLink  The full password reset URL with token
     */
    void sendPasswordResetEmail(String toEmail, String adminName, String resetLink);

    /**
     * Sends an email verification link to the user's NEW email address.
     *
     * @param toNewEmail   The new email address to verify
     * @param userName     User's name for personalization
     * @param verifyLink   The full verification URL with token
     */
    void sendEmailVerification(String toNewEmail, String userName, String verifyLink);

    /**
     * Sends a 6-digit OTP to the user's NEW email address for email change verification.
     *
     * @param toNewEmail  The new email address to verify
     * @param userName    User's name for personalization
     * @param otp         The 6-digit OTP code
     */
    void sendEmailChangeOtp(String toNewEmail, String userName, String otp);
}
