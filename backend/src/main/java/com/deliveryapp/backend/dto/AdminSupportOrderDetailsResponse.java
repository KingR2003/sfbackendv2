package com.deliveryapp.backend.dto;

import com.deliveryapp.backend.entity.Address;
import com.deliveryapp.backend.entity.OrderEntity;
import com.deliveryapp.backend.entity.Support;
import com.deliveryapp.backend.entity.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminSupportOrderDetailsResponse {

    // Support Ticket Information
    private Long supportId;
    private String ticketId;
    private String subject;
    private String message;
    private TicketStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> imageUrls;

    // Order Information
    private Long orderId;
    private OrderEntity orderDetails;

    // Customer Information
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerMobile;

    // Shipping Address
    private Address shippingAddress;

    // Order Items
    private List<OrderItemDetailsDto> orderItems;

    public static AdminSupportOrderDetailsResponse fromSupportAndOrder(
            Support support,
            OrderEntity order,
            Map<String, Object> customerInfo,
            Address address,
            List<OrderItemDetailsDto> items,
            List<String> imageUrls) {

        AdminSupportOrderDetailsResponse response = new AdminSupportOrderDetailsResponse();

        // Support information
        response.setSupportId(support.getId());
        response.setTicketId(support.getTicketId());
        response.setSubject(support.getSubject());
        response.setMessage(support.getMessage());
        response.setStatus(support.getStatus());
        response.setCreatedAt(support.getCreatedAt());
        response.setUpdatedAt(support.getUpdatedAt());
        response.setImageUrls(imageUrls);

        // Order information
        if (order != null) {
            response.setOrderId(order.getId());
            response.setOrderDetails(order);
            response.setOrderItems(items);
        }

        // Customer information
        if (customerInfo != null) {
            response.setCustomerId((Long) customerInfo.get("id"));
            response.setCustomerName((String) customerInfo.get("name"));
            response.setCustomerEmail((String) customerInfo.get("email"));
            response.setCustomerMobile((String) customerInfo.get("mobile"));
        }

        // Shipping address
        response.setShippingAddress(address);

        return response;
    }
}
