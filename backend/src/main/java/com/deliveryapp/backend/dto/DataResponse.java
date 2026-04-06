package com.deliveryapp.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class DataResponse<T> extends ApiResponse {
    private T data;

    public DataResponse(Integer status, String message, T data) {
        super(status, message);
        this.data = data;
    }

    public DataResponse(Integer status, String message, T data, Boolean success) {
        super(status, message, success);
        this.data = data;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}
