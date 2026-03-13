package com.deliveryapp.backend.exception;

public class TooManyOtpAttemptsException extends RuntimeException {
    public TooManyOtpAttemptsException(String message) {
        super(message);
    }
}
