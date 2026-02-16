package com.deliveryapp.backend.util;

import java.time.LocalDateTime;

public final class DateTimeUtil {
    private DateTimeUtil() {
    }

    public static LocalDateTime getCurrentDateTime() {
        return LocalDateTime.now();
    }

    public static String formatDateTime(LocalDateTime dateTime) {
        return dateTime.toString();
    }
}
