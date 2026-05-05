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
}
