package com.deliveryapp.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse {
    private Integer status;
    private String message;
    private Boolean success;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    public ApiResponse(Integer status, String message) {
        this.status = status;
        this.message = message;
        this.success = status >= 200 && status < 300;
        this.timestamp = LocalDateTime.now();
    }

    public ApiResponse(Integer status, String message, Boolean success) {
        this.status = status;
        this.message = message;
        this.success = success;
        this.timestamp = LocalDateTime.now();
    }

    protected ApiResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
