package com.deliveryapp.backend.dto;

public class AdminRegisterRequest {
    private String name;
    private String email;
    private String mobile;
    private String password;
    private String secretKey;

    public AdminRegisterRequest() {
    }

    public AdminRegisterRequest(String name, String email, String mobile, String password, String secretKey) {
        this.name = name;
        this.email = email;
        this.mobile = mobile;
        this.password = password;
        this.secretKey = secretKey;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }
}
