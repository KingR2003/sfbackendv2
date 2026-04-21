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
