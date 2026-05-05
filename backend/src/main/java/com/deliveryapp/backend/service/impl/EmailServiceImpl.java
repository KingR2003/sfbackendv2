package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendSupportReply(String toEmail, String ticketId, String subject,
                                  String adminName, String replyText) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Svasthya Fresh Support");
            helper.setTo(toEmail);
            helper.setSubject("Re: [Ticket #" + ticketId + "] " + subject);
            helper.setText(buildEmailBody(ticketId, adminName, replyText), true);

            mailSender.send(message);

        } catch (Exception e) {
            throw new RuntimeException("Failed to send support reply email: " + e.getMessage(), e);
        }
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String adminName, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Svasthya Fresh Admin");
            helper.setTo(toEmail);
            helper.setSubject("Password Reset Request - Svasthya Fresh Admin");
            helper.setText(buildPasswordResetEmailBody(adminName, resetLink), true);

            mailSender.send(message);

        } catch (Exception e) {
            throw new RuntimeException("Failed to send password reset email: " + e.getMessage(), e);
        }
    }

    private String buildPasswordResetEmailBody(String adminName, String resetLink) {
        return "<!DOCTYPE html><html><body style='font-family: Arial, sans-serif; color: #333;'>"
                + "<div style='max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;'>"
                + "<h2 style='color: #2e7d32;'>Svasthya Fresh Admin</h2>"
                + "<hr style='border-color: #e0e0e0;'/>"
                + "<p>Hello <strong>" + (adminName != null ? adminName : "Admin") + "</strong>,</p>"
                + "<p>We received a request to reset the password for your admin account. Click the button below to set a new password:</p>"
                + "<div style='text-align: center; margin: 32px 0;'>"
                + "<a href='" + resetLink + "' style='background-color: #2e7d32; color: white; padding: 14px 28px; "
                + "text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;'>Reset My Password</a>"
                + "</div>"
                + "<p style='color: #777; font-size: 13px;'>This link will expire in <strong>30 minutes</strong>.</p>"
                + "<p style='color: #777; font-size: 13px;'>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>"
                + "<hr style='border-color: #e0e0e0;'/>"
                + "<p style='font-size: 12px; color: #999;'>This is an automated email. Please do not reply directly to this email.</p>"
                + "</div></body></html>";
    }

    private String buildEmailBody(String ticketId, String adminName, String replyText) {
        return "<!DOCTYPE html><html><body style='font-family: Arial, sans-serif; color: #333;'>"
                + "<div style='max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;'>"
                + "<h2 style='color: #2e7d32;'>Svasthya Fresh Support</h2>"
                + "<hr style='border-color: #e0e0e0;'/>"
                + "<p>Hello,</p>"
                + "<p>Our support team has responded to your ticket <strong>#" + ticketId + "</strong>:</p>"
                + "<div style='background: #f5f5f5; border-left: 4px solid #2e7d32; padding: 16px; border-radius: 4px; margin: 16px 0;'>"
                + "<p style='margin: 0;'>" + replyText.replace("\n", "<br/>") + "</p>"
                + "</div>"
                + "<p style='color: #777; font-size: 12px;'>— " + (adminName != null ? adminName : "Support Team") + ", Svasthya Fresh</p>"
                + "<hr style='border-color: #e0e0e0;'/>"
                + "<p style='font-size: 12px; color: #999;'>This is an automated email. Please do not reply directly to this email.</p>"
                + "</div></body></html>";
    }
}
