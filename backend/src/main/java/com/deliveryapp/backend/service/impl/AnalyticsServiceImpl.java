package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.dto.*;
import com.deliveryapp.backend.entity.*;
import com.deliveryapp.backend.repository.*;
import com.deliveryapp.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;
    private final BannerRepository bannerRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final PaymentRepository paymentRepository;
    private final VisitorRepository visitorRepository;

    @Override
    @Transactional(readOnly = true)
    public AnalyticsDashboardDto getDashboardMetrics(int days) {
        RevenueReportDto revDto = getRevenueReport(days);
        ProductPerformanceDto prodDto = getProductPerformance(days);
        DemographicReportDto demoDto = getDemographicReport(days);
        FunnelReportDto funnelDto = getFunnelReport(days);
        InventoryReportDto invDto = getInventoryReport(days);
        
        List<AnalyticsDashboardDto.ProductPerformanceItem> productPerformance = new ArrayList<>();
        int iIdx = 0;
        for (Map.Entry<String, BigDecimal> entry : prodDto.getTop5ProductsByRevenue().entrySet()) {
             if(iIdx >= 3) break;
             long units = prodDto.getProductPerformanceTable().stream()
                 .filter(p -> p.getProduct().equals(entry.getKey()))
                 .mapToLong(ProductPerformanceDto.ProductPerformanceItem::getUnitsSold)
                 .sum();
             productPerformance.add(new AnalyticsDashboardDto.ProductPerformanceItem(
                 entry.getKey(), entry.getValue(), units
             ));
             iIdx++;
        }
        
        Map<String, Double> customerSplit = new HashMap<>(); // Convert numbers to percentages
        if (demoDto.getGenderDistribution() != null) {
             long totalGender = demoDto.getGenderDistribution().values().stream().mapToLong(Long::longValue).sum();
             for (Map.Entry<String, Long> entry : demoDto.getGenderDistribution().entrySet()) {
                 customerSplit.put(entry.getKey(), totalGender > 0 ? (entry.getValue() * 100.0) / totalGender : 0.0);
             }
        }
        
        OrderStatusReportDto statusDto = getOrderStatusReport(days);
        
        AnalyticsDashboardDto.AlertsData alerts = AnalyticsDashboardDto.AlertsData.builder()
            .lowStockCount(invDto.getReorderNeededCount()) 
            .expiryAlertCount(invDto.getExpirySoonCount()) 
            .highCancellationRateStr(statusDto.getCancelledPercentage()) 
            .highRefundsMsg(statusDto.getCancelledPercentage() > 10.0 ? "High cancellation rate detected" : "Cancellation rate is normal")
            .build();
            
        Map<String, String> specificProducts = new HashMap<>();
        for (Map.Entry<String, Map<String, Long>> entry : invDto.getStockVsSoldTopProducts().entrySet()) {
             if (specificProducts.size() < 3) {
                 specificProducts.put(entry.getKey(), entry.getValue().get("Stock") + " / " + invDto.getTotalStockUnits());
             }
        }
            
        AnalyticsDashboardDto.InventoryHealthData invHealth = AnalyticsDashboardDto.InventoryHealthData.builder()
            .totalStock(invDto.getTotalStockUnits())
            .outOfStock(invDto.getOutOfStockCount())
            .expirySoon(invDto.getExpirySoonCount())
            .reorderNeeded(invDto.getReorderNeededCount())
            .specificProducts(specificProducts)
            .build();
            
        List<OrderEntity> recentOrderEntities = orderRepository.findAll().stream()
                .sorted(Comparator.comparing(OrderEntity::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(5)
                .collect(Collectors.toList());

        List<AnalyticsDashboardDto.RecentOrderItem> recentOrders = new ArrayList<>();
        for (OrderEntity order : recentOrderEntities) {
            String userName = userRepository.findById(order.getUserId()).map(User::getName).orElse("Unknown User");
            recentOrders.add(new AnalyticsDashboardDto.RecentOrderItem(
                "#ORD-" + order.getId(), 
                userName, 
                order.getFinalAmount() != null ? order.getFinalAmount() : BigDecimal.ZERO, 
                order.getOrderStatus()));
        }
        
        Map<String, BigDecimal> revenueOverview = new HashMap<>();
        Map<String, Long> ordersOverview = new HashMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM");
        
        List<OrderEntity> allOrders = orderRepository.findAll();
        for (OrderEntity order : allOrders) {
            if (order.getCreatedAt() != null) {
                String month = order.getCreatedAt().format(monthFormatter);
                ordersOverview.put(month, ordersOverview.getOrDefault(month, 0L) + 1);
                if ("DELIVERED".equals(order.getOrderStatus()) && order.getFinalAmount() != null) {
                    revenueOverview.put(month, revenueOverview.getOrDefault(month, BigDecimal.ZERO).add(order.getFinalAmount()));
                }
            }
        }

        long orderCount = orderRepository.count();
        BigDecimal avgOrderValue = orderCount > 0 ? revDto.getTotalRevenue().divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        return AnalyticsDashboardDto.builder()
            .totalRevenue(revDto.getTotalRevenue())
            .totalRevenueChange(0.0)
            .totalOrders(orderCount)
            .totalOrdersChange(0.0)
            .overallConversion(funnelDto.getOverallConversion())
            .overallConversionChange(0.0)
            .avgOrderValue(avgOrderValue)
            .avgOrderValueChange(0.0)
            .revenueOverview(revenueOverview)
            .ordersOverview(ordersOverview)
            .productPerformance(productPerformance)
            .customerSplit(customerSplit)
            .ageGroups(demoDto.getAgeDistribution())
            .alerts(alerts)
            .inventoryHealth(invHealth)
            .recentOrders(recentOrders)
            .totalUsers(userRepository.count())
            .activeProducts(productRepository.countActiveProducts())
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RevenueReportDto getRevenueReport(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<OrderEntity> orders = orderRepository.findByCreatedAtAfter(startDate);
        
        BigDecimal totalRev = orders.stream()
                .filter(o -> "DELIVERED".equals(o.getOrderStatus()))
                .map(OrderEntity::getFinalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Map order items to product revenue
        Map<Long, BigDecimal> productRevMap = new HashMap<>(); // variantId -> revenue
        Map<Long, Long> productUnitsMap = new HashMap<>(); // variantId -> units
        
        for (OrderEntity order : orders) {
            if (!"DELIVERED".equals(order.getOrderStatus())) continue;
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            for (OrderItem item : items) {
                Long vId = item.getVariantId();
                productUnitsMap.put(vId, productUnitsMap.getOrDefault(vId, 0L) + item.getQuantity());
                productRevMap.put(vId, productRevMap.getOrDefault(vId, BigDecimal.ZERO).add(item.getSubtotal()));
            }
        }

        // Fetch variants and map
        Map<String, BigDecimal> revByProduct = new HashMap<>();
        List<RevenueReportDto.RevenueBreakdownItem> breakdown = new ArrayList<>();
        
        for (Map.Entry<Long, BigDecimal> entry : productRevMap.entrySet()) {
            productVariantRepository.findById(entry.getKey()).ifPresent(variant -> {
                String name = variant.getProduct() != null && variant.getProduct().getName() != null ? variant.getProduct().getName() + " " + variant.getVariantName() : variant.getVariantName();
                revByProduct.put(name, revByProduct.getOrDefault(name, BigDecimal.ZERO).add(entry.getValue()));
                
                long units = productUnitsMap.getOrDefault(entry.getKey(), 0L);
                BigDecimal avg = units > 0 ? entry.getValue().divide(BigDecimal.valueOf(units), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                
                breakdown.add(RevenueReportDto.RevenueBreakdownItem.builder()
                        .product(name)
                        .unitsSold(units)
                        .avgPrice(avg)
                        .totalRevenue(entry.getValue())
                        .build());
            });
        }

        // Try mapping demographic (age/gender)
        Map<String, BigDecimal> revByGender = new HashMap<>();
        Map<String, BigDecimal> revByAge = new HashMap<>();
        
        for (OrderEntity order : orders) {
            if (!"DELIVERED".equals(order.getOrderStatus())) continue;
            User u = userRepository.findById(order.getUserId()).orElse(null);
            if (u != null) {
                String gender = u.getGender() != null ? u.getGender() : "Unknown";
                revByGender.put(gender, revByGender.getOrDefault(gender, BigDecimal.ZERO).add(order.getFinalAmount()));
                
                String ageGroup = "Unknown";
                if (u.getDateOfBirth() != null) {
                    int age = Period.between(u.getDateOfBirth(), LocalDate.now()).getYears();
                    if (age < 18) ageGroup = "<18";
                    else if (age <= 24) ageGroup = "18-24";
                    else if (age <= 34) ageGroup = "25-34";
                    else if (age <= 44) ageGroup = "35-44";
                    else if (age <= 54) ageGroup = "45-54";
                    else ageGroup = "55+";
                }
                revByAge.put(ageGroup, revByAge.getOrDefault(ageGroup, BigDecimal.ZERO).add(order.getFinalAmount()));
            }
        }

        Map<String, BigDecimal> trend = new HashMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM");
        for (OrderEntity order : orders) {
            if ("DELIVERED".equals(order.getOrderStatus()) && order.getCreatedAt() != null && order.getFinalAmount() != null) {
                String month = order.getCreatedAt().format(monthFormatter);
                trend.put(month, trend.getOrDefault(month, BigDecimal.ZERO).add(order.getFinalAmount()));
            }
        }

        return RevenueReportDto.builder()
                .totalRevenue(totalRev)
                .revenueChangePercentage(0.0) // Change tracking requires historical table comparison
                .monthlyRevenueTrend(trend)
                .revenueByProduct(revByProduct)
                .revenueByGender(revByGender)
                .revenueByAgeGroup(revByAge)
                .revenueBreakdownTable(breakdown)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductPerformanceDto getProductPerformance(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<OrderEntity> orders = orderRepository.findByCreatedAtAfter(startDate);
        
        Map<Long, Long> unitsMap = new HashMap<>();
        Map<Long, BigDecimal> revMap = new HashMap<>();
        
        long totalUnits = 0;
        for (OrderEntity order : orders) {
            if ("DELIVERED".equals(order.getOrderStatus())) {
                List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
                for (OrderItem item : items) {
                    Long vId = item.getVariantId();
                    long qty = item.getQuantity();
                    totalUnits += qty;
                    unitsMap.put(vId, unitsMap.getOrDefault(vId, 0L) + qty);
                    revMap.put(vId, revMap.getOrDefault(vId, BigDecimal.ZERO).add(item.getSubtotal()));
                }
            }
        }

        List<ProductPerformanceDto.ProductPerformanceItem> table = new ArrayList<>();
        Map<String, Long> categoryUnits = new HashMap<>();
        
        List<ProductVariant> allVariants = productVariantRepository.findAll();
        
        for (ProductVariant v : allVariants) {
            long units = unitsMap.getOrDefault(v.getId(), 0L);
            BigDecimal rev = revMap.getOrDefault(v.getId(), BigDecimal.ZERO);
            String catName = v.getProduct() != null && v.getProduct().getCategoryId() != null ? 
                categoryRepository.findById(v.getProduct().getCategoryId()).map(Category::getName).orElse("Unknown") : "Unknown";
                
            categoryUnits.put(catName, categoryUnits.getOrDefault(catName, 0L) + units);
            
            String productName = v.getProduct() != null && v.getProduct().getName() != null ? v.getProduct().getName() + " " + v.getVariantName() : v.getVariantName();
            
            table.add(ProductPerformanceDto.ProductPerformanceItem.builder()
                    .product(productName)
                    .category(catName)
                    .unitsSold(units)
                    .revenue(rev)
                    .stock(v.getStockQuantity() == null ? 0 : v.getStockQuantity().longValue())
                    .refundRate(0.0) // Mock
                    .status(v.getIsActive() != null && v.getIsActive() ? "In Stock" : "Out of Stock")
                    .build());
        }

        Map<String, BigDecimal> growth = new HashMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM");
        for (OrderEntity order : orders) {
            if ("DELIVERED".equals(order.getOrderStatus()) && order.getCreatedAt() != null && order.getFinalAmount() != null) {
                String month = order.getCreatedAt().format(monthFormatter);
                growth.put(month, growth.getOrDefault(month, BigDecimal.ZERO).add(order.getFinalAmount()));
            }
        }
        
        Map<String, BigDecimal> top5 = revMap.entrySet().stream()
                .sorted((a,b)-> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .collect(Collectors.toMap(
                    e -> productVariantRepository.findById(e.getKey())
                            .map(v -> v.getProduct() != null && v.getProduct().getName() != null ? v.getProduct().getName() + " " + v.getVariantName() : v.getVariantName())
                            .orElse("Unknown"),
                    Map.Entry::getValue,
                    (a, b) -> a,
                    LinkedHashMap::new
                ));

        return ProductPerformanceDto.builder()
                .topRevenueProduct(table.stream().max(Comparator.comparing(ProductPerformanceDto.ProductPerformanceItem::getRevenue)).map(ProductPerformanceDto.ProductPerformanceItem::getProduct).orElse("N/A"))
                .slowMovingProduct(table.stream().min(Comparator.comparing(ProductPerformanceDto.ProductPerformanceItem::getUnitsSold)).map(ProductPerformanceDto.ProductPerformanceItem::getProduct).orElse("N/A"))
                .totalUnitsSold(totalUnits)
                .avgRefundRate(14.5)
                .topCategory(categoryUnits.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("N/A"))
                .lowOutOfStock((int) table.stream().filter(i -> i.getStock() < 10).count())
                .topProductRevenue(table.stream().map(ProductPerformanceDto.ProductPerformanceItem::getRevenue).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO))
                .top5ProductsByRevenue(top5)
                .unitsSoldByCategory(categoryUnits)
                .monthlyProductRevenueGrowth(growth)
                .productPerformanceTable(table)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DemographicReportDto getDemographicReport(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<User> newUsers = userRepository.findByCreatedAtAfter(startDate);
        
        long totalCustomers = userRepository.count();
        long newCustomers = newUsers.size();
        
        Map<String, Long> newVsRet = new HashMap<>();
        newVsRet.put("New", newCustomers);
        newVsRet.put("Returning", Math.max(0, totalCustomers - newCustomers));
        
        Map<String, Long> genderDist = new HashMap<>();
        Map<String, Long> ageDist = new HashMap<>();
        
        List<User> allUsers = userRepository.findAll();
        for (User u : allUsers) {
            String gender = u.getGender() != null ? u.getGender().substring(0, 1).toUpperCase() + u.getGender().substring(1).toLowerCase() : "Unknown";
            genderDist.put(gender, genderDist.getOrDefault(gender, 0L) + 1);
            
            String ageGroup = "Unknown";
            if (u.getDateOfBirth() != null) {
                int age = Period.between(u.getDateOfBirth(), LocalDate.now()).getYears();
                if (age < 18) ageGroup = "<18";
                else if (age <= 24) ageGroup = "18-24";
                else if (age <= 34) ageGroup = "25-34";
                else if (age <= 44) ageGroup = "35-44";
                else if (age <= 54) ageGroup = "45-54";
                else ageGroup = "55+";
            }
            ageDist.put(ageGroup, ageDist.getOrDefault(ageGroup, 0L) + 1);
        }

        // Calculate revenue by gender and age group, and find Top Customers
        Map<String, BigDecimal> revByGender = new HashMap<>();
        Map<String, BigDecimal> revByAge = new HashMap<>();
        
        // Find top customers by revenue
        List<OrderEntity> orders = orderRepository.findByCreatedAtAfter(startDate);
        Map<Long, BigDecimal> userRevenueMap = new HashMap<>();
        Map<Long, Long> userOrdersMap = new HashMap<>();
        
        for (OrderEntity order : orders) {
            if (!"DELIVERED".equals(order.getOrderStatus())) continue;
            
            Long uId = order.getUserId();
            userRevenueMap.put(uId, userRevenueMap.getOrDefault(uId, BigDecimal.ZERO).add(order.getFinalAmount()));
            userOrdersMap.put(uId, userOrdersMap.getOrDefault(uId, 0L) + 1);
            
            User u = userRepository.findById(uId).orElse(null);
            if (u != null) {
                String gender = u.getGender() != null ? u.getGender().substring(0, 1).toUpperCase() + u.getGender().substring(1).toLowerCase() : "Unknown";
                revByGender.put(gender, revByGender.getOrDefault(gender, BigDecimal.ZERO).add(order.getFinalAmount()));
                
                String ageGroup = "Unknown";
                if (u.getDateOfBirth() != null) {
                    int age = Period.between(u.getDateOfBirth(), LocalDate.now()).getYears();
                    if (age < 18) ageGroup = "<18";
                    else if (age <= 24) ageGroup = "18-24";
                    else if (age <= 34) ageGroup = "25-34";
                    else if (age <= 44) ageGroup = "35-44";
                    else if (age <= 54) ageGroup = "45-54";
                    else ageGroup = "55+";
                }
                revByAge.put(ageGroup, revByAge.getOrDefault(ageGroup, BigDecimal.ZERO).add(order.getFinalAmount()));
            }
        }
        
        List<Map.Entry<Long, BigDecimal>> topUserEntries = userRevenueMap.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .collect(Collectors.toList());
                
        List<DemographicReportDto.TopCustomerItem> topCustomersTable = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> entry : topUserEntries) {
            Long userId = entry.getKey();
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                String location = "Unknown";
                List<Address> addresses = addressRepository.findByUserIdAndStatus(userId, "active");
                if (addresses != null && !addresses.isEmpty()) {
                    Address addr = addresses.get(0);
                    for (Address a : addresses) {
                        if (a.getIsDefault() != null && a.getIsDefault() == 1) {
                            addr = a;
                            break;
                        }
                    }
                    if (addr.getAreaName() != null && !addr.getAreaName().isEmpty()) {
                        location = addr.getAreaName();
                    } else if (addr.getStreetNo() != null && !addr.getStreetNo().isEmpty()) {
                        location = addr.getStreetNo();
                    }
                }
                
                String ageGroup = "Unknown";
                if (user.getDateOfBirth() != null) {
                    int age = Period.between(user.getDateOfBirth(), LocalDate.now()).getYears();
                    if (age < 18) ageGroup = "<18";
                    else if (age <= 24) ageGroup = "18-24";
                    else if (age <= 34) ageGroup = "25-34";
                    else if (age <= 44) ageGroup = "35-44";
                    else if (age <= 54) ageGroup = "45-54";
                    else ageGroup = "55+";
                }
                
                topCustomersTable.add(DemographicReportDto.TopCustomerItem.builder()
                        .customer(user.getName() != null ? user.getName() : "Unknown")
                        .gender(user.getGender() != null ? user.getGender().substring(0, 1).toUpperCase() + user.getGender().substring(1).toLowerCase() : "Unknown")
                        .age(ageGroup)
                        .location(location)
                        .orders(userOrdersMap.get(userId))
                        .revenue(entry.getValue())
                        .build());
            }
        }

        // Just use empty maps for revenue by gender/age here, client can derive or we can reuse logic
        return DemographicReportDto.builder()
                .totalCustomers(totalCustomers)
                .newCustomers(newCustomers)
                .returningCustomersPercentage(totalCustomers > 0 ? ((totalCustomers - newCustomers) * 100.0) / totalCustomers : 0.0)
                .totalRevenue(orderRepository.calculateTotalRevenue() != null ? orderRepository.calculateTotalRevenue() : BigDecimal.ZERO)
                .newVsReturning(newVsRet)
                .genderDistribution(genderDist)
                .ageDistribution(ageDist)
                .revenueByGender(revByGender)
                .revenueByAgeGroup(revByAge)
                .topCustomersTable(topCustomersTable)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public FunnelReportDto getFunnelReport(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<OrderEntity> orders = orderRepository.findByCreatedAtAfter(startDate);
        
        long delivered = orders.stream().filter(o -> "DELIVERED".equals(o.getOrderStatus())).count();
        long checkout = orders.size();
        
        long addToCart = cartRepository.count(); // actual carts 
        long visitors = visitorRepository.countDistinctSessionIdByVisitedAtAfter(startDate);
        
        // Ensure logical funnel progression: visitors >= addToCart >= checkout >= delivered
        if (visitors < addToCart) visitors = addToCart;
        if (addToCart < checkout) addToCart = checkout;
        
        List<FunnelReportDto.FunnelStageItem> table = new ArrayList<>();
        table.add(new FunnelReportDto.FunnelStageItem("Visitors", visitors, 100.0, 0.0));
        table.add(new FunnelReportDto.FunnelStageItem("Add to Cart", addToCart, visitors > 0 ? (addToCart * 100.0) / visitors : 0, 0.0));
        table.add(new FunnelReportDto.FunnelStageItem("Checkout Started", checkout, addToCart > 0 ? (checkout * 100.0) / addToCart : 0, 0.0));
        
        return FunnelReportDto.builder()
                .visitors(visitors)
                .addToCart(addToCart)
                .checkoutStarted(checkout)
                .paymentCompleted(delivered)
                .delivered(delivered)
                .overallConversion(visitors > 0 ? (delivered * 100.0) / visitors : 0.0)
                .cartAbandonmentRate(addToCart > 0 ? ((addToCart - checkout) * 100.0) / addToCart : 0.0) 
                .funnelSummaryTable(table)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderStatusReportDto getOrderStatusReport(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<OrderEntity> orders = orderRepository.findByCreatedAtAfter(startDate);
        
        long total = orders.size();
        long delivered = 0;
        long cancelled = 0;
        long returned = 0;
        
        Map<String, Long> dist = new HashMap<>();
        Map<String, Map<String, Long>> monthlyStatusBreakdown = new HashMap<>();
        Map<String, Long> cancellationTrend = new HashMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM");

        for (OrderEntity o : orders) {
            String status = o.getOrderStatus();
            dist.put(status, dist.getOrDefault(status, 0L) + 1);
            if ("DELIVERED".equals(status)) delivered++;
            if ("CANCELLED".equals(status)) cancelled++;
            if ("RETURNED".equals(status)) returned++;
            
            if (o.getCreatedAt() != null) {
                String month = o.getCreatedAt().format(monthFormatter);
                monthlyStatusBreakdown.putIfAbsent(month, new HashMap<>());
                Map<String, Long> monthMap = monthlyStatusBreakdown.get(month);
                monthMap.put(status, monthMap.getOrDefault(status, 0L) + 1);
                
                if ("CANCELLED".equals(status)) {
                    cancellationTrend.put(month, cancellationTrend.getOrDefault(month, 0L) + 1);
                }
            }
        }
        
        List<OrderStatusReportDto.StatusDistributionItem> table = new ArrayList<>();
        for (Map.Entry<String, Long> e : dist.entrySet()) {
            table.add(new OrderStatusReportDto.StatusDistributionItem(e.getKey(), e.getValue(), total > 0 ? (e.getValue() * 100.0) / total : 0.0));
        }

        return OrderStatusReportDto.builder()
                .totalOrders(total)
                .totalDelivered(delivered)
                .cancelledPercentage(total > 0 ? (cancelled * 100.0) / total : 0.0)
                .deliveredPercentage(total > 0 ? (delivered * 100.0) / total : 0.0)
                .returnInProgress(0L)
                .returned(returned)
                .cancelledOrders(cancelled)
                .orderStatusDistribution(dist)
                .monthlyStatusBreakdown(monthlyStatusBreakdown)
                .cancellationTrend(cancellationTrend)
                .statusDistributionTable(table)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BannerAnalyticsDto getBannerAnalytics(int days) {
        List<Banner> banners = bannerRepository.findAll();
        List<BannerAnalyticsDto.BannerAnalyticsItem> leaderboard = banners.stream().map(b -> 
            BannerAnalyticsDto.BannerAnalyticsItem.builder()
                .id(b.getId())
                .title(b.getTitle())
                .campaign(b.getTitle() != null ? b.getTitle() : "Unknown")
                .status(b.getIsActive() != null && b.getIsActive() ? "Active" : "Inactive")
                .campaignType(b.getCampaignType() != null ? b.getCampaignType() : "New Product")
                .platform(b.getPlatform() != null ? b.getPlatform() : "Both")
                .views(b.getViews() != null ? b.getViews() : 0L)
                .clicks(b.getClicks() != null ? b.getClicks() : 0L)
                .clickThroughRate(b.getViews() != null && b.getViews() > 0 ? ((double) (b.getClicks() != null ? b.getClicks() : 0L) / b.getViews()) * 100.0 : 0.0)
                .gender(b.getGender() != null ? b.getGender() : "All Users")
                .build()
        ).sorted(Comparator.comparingLong(BannerAnalyticsDto.BannerAnalyticsItem::getViews).reversed()).collect(Collectors.toList());
        
        long totalImpressions = leaderboard.stream().mapToLong(BannerAnalyticsDto.BannerAnalyticsItem::getViews).sum();
        long totalClicks = leaderboard.stream().mapToLong(BannerAnalyticsDto.BannerAnalyticsItem::getClicks).sum();
        double avgCTR = totalImpressions > 0 ? (totalClicks * 100.0) / totalImpressions : 0.0;
        
        String topPerformer = leaderboard.isEmpty() ? "N/A" : leaderboard.get(0).getTitle();
        long topViews = leaderboard.isEmpty() ? 0L : leaderboard.get(0).getViews();
        
        Map<String, Map<String, Long>> viewsClicksTrend = new HashMap<>();
        Map<String, Long> viewsByCampaign = leaderboard.stream().collect(Collectors.groupingBy(
            BannerAnalyticsDto.BannerAnalyticsItem::getCampaignType,
            Collectors.summingLong(BannerAnalyticsDto.BannerAnalyticsItem::getViews)
        ));
        Map<String, Long> impressionsByPlatform = leaderboard.stream().collect(Collectors.groupingBy(
            BannerAnalyticsDto.BannerAnalyticsItem::getPlatform,
            Collectors.summingLong(BannerAnalyticsDto.BannerAnalyticsItem::getViews)
        ));
        Map<String, Long> impressionsByGender = leaderboard.stream().collect(Collectors.groupingBy(
            BannerAnalyticsDto.BannerAnalyticsItem::getGender,
            Collectors.summingLong(BannerAnalyticsDto.BannerAnalyticsItem::getViews)
        ));
        
        Map<String, Map<String, Long>> performanceComp = new HashMap<>();
        for (BannerAnalyticsDto.BannerAnalyticsItem item : leaderboard) {
            Map<String, Long> perf = new HashMap<>();
            perf.put("Views", item.getViews());
            perf.put("Clicks", item.getClicks());
            performanceComp.put(item.getTitle(), perf);
        }
        
        return BannerAnalyticsDto.builder()
                .totalImpressions(totalImpressions)
                .impressionChange(0.0) // Requires historical tracking
                .totalClicks(totalClicks)
                .clickChange(0.0) // Requires historical tracking
                .averageCTR(avgCTR)
                .ctrChange(0.0) // Requires historical tracking
                .topPerformerName(topPerformer)
                .topPerformerViews(topViews)
                .viewsClicksTrendLast14Days(viewsClicksTrend)
                .viewsByCampaignType(viewsByCampaign)
                .impressionsByPlatform(impressionsByPlatform)
                .impressionsByGender(impressionsByGender)
                .bannerPerformanceComparison(performanceComp)
                .bannerLeaderboard(leaderboard)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentRefundReportDto getPaymentRefundReport(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<OrderEntity> orders = orderRepository.findByCreatedAtAfter(startDate);
        
        List<Payment> payments = paymentRepository.findAll();
        Map<Long, Payment> paymentMap = payments.stream()
                .collect(Collectors.toMap(Payment::getId, p -> p));
        
        BigDecimal totalRev = BigDecimal.ZERO;
        BigDecimal totalRefund = BigDecimal.ZERO;
        
        long paidCount = 0;
        long pendingCount = 0;
        long refundedCount = 0;
        long failedCount = 0;
        
        Map<String, Long> paymentDist = new HashMap<>();
        Map<String, BigDecimal> revenueByMethod = new HashMap<>();
        Map<String, Long> refundTrend = new HashMap<>();
        Map<String, BigDecimal> refundAmountTrend = new HashMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM");
        
        for (OrderEntity o : orders) {
            Payment p = o.getPaymentId() != null ? paymentMap.get(o.getPaymentId()) : null;
            
            String method = "Unknown";
            String status = "PENDING";
            
            if (p != null) {
                method = p.getPaymentMethod() != null ? p.getPaymentMethod() : "Unknown";
                status = p.getPaymentStatus() != null ? p.getPaymentStatus() : "PENDING";
            } else {
                if ("DELIVERED".equalsIgnoreCase(o.getOrderStatus()) || "SHIPPED".equalsIgnoreCase(o.getOrderStatus())) {
                    status = "PAID";
                    method = "Unknown"; 
                } else if ("CANCELLED".equalsIgnoreCase(o.getOrderStatus())) {
                    status = "FAILED";
                } else if ("RETURNED".equalsIgnoreCase(o.getOrderStatus())) {
                    status = "REFUNDED";
                }
            }
            
            paymentDist.put(method, paymentDist.getOrDefault(method, 0L) + 1);
            
            if ("PAID".equalsIgnoreCase(status) || "SUCCESS".equalsIgnoreCase(status)) {
                paidCount++;
                totalRev = totalRev.add(o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO);
                revenueByMethod.put(method, revenueByMethod.getOrDefault(method, BigDecimal.ZERO).add(o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO));
            } else if ("REFUNDED".equalsIgnoreCase(status)) {
                refundedCount++;
                totalRefund = totalRefund.add(o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO);
                
                LocalDateTime date = p != null ? p.getCreatedAt() : o.getCreatedAt();
                if (date != null) {
                    String month = date.format(monthFormatter);
                    refundTrend.put(month, refundTrend.getOrDefault(month, 0L) + 1);
                    refundAmountTrend.put(month, refundAmountTrend.getOrDefault(month, BigDecimal.ZERO).add(o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO));
                }
            } else if ("FAILED".equalsIgnoreCase(status)) {
                failedCount++;
            } else {
                pendingCount++;
            }
        }
        
        double refundRate = orders.size() > 0 ? ((double) refundedCount / orders.size()) * 100.0 : 0.0;
        double failedRate = orders.size() > 0 ? ((double) failedCount / orders.size()) * 100.0 : 0.0;
        
        List<PaymentRefundReportDto.PaymentMethodDetailItem> table = new ArrayList<>();
        for (Map.Entry<String, Long> entry : paymentDist.entrySet()) {
            BigDecimal revenue = revenueByMethod.getOrDefault(entry.getKey(), BigDecimal.ZERO);
            double share = totalRev.compareTo(BigDecimal.ZERO) > 0 ? (revenue.doubleValue() / totalRev.doubleValue()) * 100.0 : 0.0;
            
            table.add(PaymentRefundReportDto.PaymentMethodDetailItem.builder()
                    .paymentMethod(entry.getKey())
                    .transactions(entry.getValue())
                    .revenue(revenue)
                    .shareOfRevenue(share)
                    .build());
        }
        
        return PaymentRefundReportDto.builder()
                .totalRevenue(totalRev)
                .totalRefundAmount(totalRefund)
                .refundRate(refundRate)
                .failedTransactionRate(failedRate)
                .paidCount(paidCount)
                .pendingCount(pendingCount)
                .refundedCount(refundedCount)
                .failedCount(failedCount)
                .paymentMethodDistribution(paymentDist)
                .revenueByPaymentMethod(revenueByMethod)
                .refundTrend(refundTrend)
                .refundAmountTrend(refundAmountTrend)
                .paymentMethodDetailsTable(table)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryReportDto getInventoryReport(int days) {
        List<ProductVariant> allVariants = productVariantRepository.findAll();
        
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<OrderEntity> recentOrders = orderRepository.findByCreatedAtAfter(startDate);
        
        Map<Long, Long> variantSoldMap = new HashMap<>();
        for (OrderEntity o : recentOrders) {
            if ("DELIVERED".equals(o.getOrderStatus())) {
                List<OrderItem> items = orderItemRepository.findByOrderId(o.getId());
                for (OrderItem item : items) {
                    variantSoldMap.put(item.getVariantId(), variantSoldMap.getOrDefault(item.getVariantId(), 0L) + item.getQuantity());
                }
            }
        }
        
        long totalStock = allVariants.stream()
                .mapToLong(v -> v.getStockQuantity() != null ? v.getStockQuantity().longValue() : 0)
                .sum();
        
        long outOfStock = allVariants.stream().filter(v -> v.getStockQuantity() == null || v.getStockQuantity() <= 0).count();
        long expirySoon = 0;
        long reorderNeeded = allVariants.stream().filter(v -> v.getStockQuantity() != null && v.getStockQuantity() > 0 && v.getStockQuantity() < 20).count(); 
        
        Map<String, Long> healthOverview = new HashMap<>();
        healthOverview.put("In Stock", allVariants.size() - outOfStock - reorderNeeded);
        healthOverview.put("Low Stock", reorderNeeded);
        healthOverview.put("Out of Stock", outOfStock);
        
        // Stock vs Sold for top 8 sold products
        Map<String, Map<String, Long>> stockVsSold = new HashMap<>();
        List<ProductVariant> sortedVariants = new ArrayList<>(allVariants);
        sortedVariants.sort((v1, v2) -> Long.compare(variantSoldMap.getOrDefault(v2.getId(), 0L), variantSoldMap.getOrDefault(v1.getId(), 0L)));
        
        for (int i = 0; i < Math.min(8, sortedVariants.size()); i++) {
            ProductVariant v = sortedVariants.get(i);
            Map<String, Long> data = new HashMap<>();
            data.put("Stock", v.getStockQuantity() != null ? v.getStockQuantity().longValue() : 0);
            data.put("Sold", variantSoldMap.getOrDefault(v.getId(), 0L));
            String name = v.getProduct() != null && v.getProduct().getName() != null ? v.getProduct().getName() + " " + v.getVariantName() : v.getVariantName();
            stockVsSold.put(name, data);
        }
        
        Map<String, Long> monthlyMovement = new HashMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM");
        String currentMonth = LocalDateTime.now().format(monthFormatter);
        monthlyMovement.put(currentMonth, totalStock);
        
        List<InventoryReportDto.InventoryDetailItem> table = new ArrayList<>();
        for (ProductVariant v : allVariants) {
            long stock = v.getStockQuantity() != null ? v.getStockQuantity().longValue() : 0;
            String status = stock == 0 ? "Out of Stock" : (stock < 20 ? "Low Stock" : "In Stock");
            String expiryRisk = "";
            String reorder = stock < 20 ? "Yes" : "—";
            
            String catName = v.getProduct() != null && v.getProduct().getCategoryId() != null ?
                    categoryRepository.findById(v.getProduct().getCategoryId()).map(Category::getName).orElse("Unknown") : "Unknown";
            
            String name = v.getProduct() != null && v.getProduct().getName() != null ? v.getProduct().getName() + " " + v.getVariantName() : v.getVariantName();
            table.add(InventoryReportDto.InventoryDetailItem.builder()
                    .product(name)
                    .category(catName)
                    .stock(stock)
                    .sold(variantSoldMap.getOrDefault(v.getId(), 0L))
                    .status(status)
                    .expiryRisk(expiryRisk)
                    .reorderNeeded(reorder)
                    .build());
        }
        
        return InventoryReportDto.builder()
                .totalStockUnits(totalStock)
                .outOfStockCount(outOfStock)
                .expirySoonCount(expirySoon)
                .reorderNeededCount(reorderNeeded)
                .stockHealthOverview(healthOverview)
                .stockVsSoldTopProducts(stockVsSold)
                .monthlyStockMovement(monthlyMovement)
                .inventoryDetailsTable(table)
                .build();
    }
}
