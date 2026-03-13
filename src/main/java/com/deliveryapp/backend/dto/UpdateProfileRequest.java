package com.deliveryapp.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    private String name;

    @Email(message = "Invalid email format")
    private String email;

    private String mobile;

    private String gender;

    @com.fasterxml.jackson.annotation.JsonProperty("dob")
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;
}
