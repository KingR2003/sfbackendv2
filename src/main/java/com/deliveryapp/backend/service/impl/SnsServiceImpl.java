package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.service.SnsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.MessageAttributeValue;
import software.amazon.awssdk.services.sns.model.PublishRequest;

import jakarta.annotation.PostConstruct;
import java.util.Map;

/**
 * Sends SMS messages via AWS SNS Direct Publish (no topic required).
 * Credentials are read from application.properties / environment variables.
 */
@Service
public class SnsServiceImpl implements SnsService {

    @Value("${aws.sns.access-key-id}")
    private String accessKeyId;

    @Value("${aws.sns.secret-access-key}")
    private String secretAccessKey;

    @Value("${aws.sns.region}")
    private String region;

    private SnsClient snsClient;

    @PostConstruct
    public void init() {
        snsClient = SnsClient.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                .build();
    }

    /**
     * Sends a Transactional SMS to the given E.164 phone number.
     *
     * @param phoneNumber E.164 formatted phone number (e.g. +919876543210)
     * @param message     SMS text
     */
    @Override
    public void sendSms(String phoneNumber, String message) {
        Map<String, MessageAttributeValue> attributes = Map.of(
                "AWS.SNS.SMS.SMSType",
                MessageAttributeValue.builder()
                        .dataType("String")
                        .stringValue("Transactional")
                        .build(),
                "AWS.SNS.SMS.SenderID",
                MessageAttributeValue.builder()
                        .dataType("String")
                        .stringValue("OTPAUTH")
                        .build()
        );

        PublishRequest request = PublishRequest.builder()
                .message(message)
                .phoneNumber(phoneNumber)
                .messageAttributes(attributes)
                .build();

        snsClient.publish(request);
    }
}
