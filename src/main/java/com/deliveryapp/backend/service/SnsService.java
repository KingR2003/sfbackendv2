package com.deliveryapp.backend.service;

/**
 * Abstraction for sending SMS messages via AWS SNS.
 */
public interface SnsService {

    /**
     * Send an SMS message to the given phone number.
     *
     * @param phoneNumber E.164 formatted phone number (e.g. +919876543210)
     * @param message     The text message to send
     */
    void sendSms(String phoneNumber, String message);
}
