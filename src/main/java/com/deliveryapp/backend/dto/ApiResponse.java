package com.deliveryapp.backend.dto;

@com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private Boolean success;
    private String message;
    private T data;
    private Integer status;

    public ApiResponse(Boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public ApiResponse(Integer status, String message, T data) {
        this.status = status;
        this.message = message;
        this.data = data;
    }

    public ApiResponse(Integer status, T data) {
        this.status = status;
        this.data = data;
    }

    public ApiResponse(Integer status, String message) {
        this.status = status;
        this.message = message;
    }

    public Boolean isSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }
}
