// package com.siva.expense_approval_system.infrastructure.config;

// import java.time.LocalDateTime;

// import org.springframework.boot.CommandLineRunner;
// import org.springframework.stereotype.Component;

// import com.siva.expense_approval_system.application.service.TenantService;
// import com.siva.expense_approval_system.application.service.UserService;
// import com.siva.expense_approval_system.domain.model.Tenant;
// import com.siva.expense_approval_system.domain.model.User;
// import com.siva.expense_approval_system.domain.model.UserRole;

// @Component
// public class DataLoader implements CommandLineRunner {

//     private final TenantService tenantService;
//     private final UserService userService;

//     public DataLoader(TenantService tenantService, UserService userService) {
//         this.tenantService = tenantService;
//         this.userService = userService;
//     }

//     @Override
//     public void run(String... args) {
//         Tenant tenant = new Tenant(null, "TechCorp", LocalDateTime.now());
//         Tenant savedTenant = tenantService.createTenant(tenant);

//         User user = new User(
//                 null,
//                 savedTenant,
//                 "Siva Sankar",
//                 "siva@techcorp.com",
//                 "change-me-before-production",
//                 UserRole.ADMIN,
//                 LocalDateTime.now());
//         userService.createUser(user);

//         System.out.println("Sample tenant and user created successfully.");
//     }
// }
