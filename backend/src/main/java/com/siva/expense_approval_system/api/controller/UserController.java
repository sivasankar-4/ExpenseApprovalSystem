package com.siva.expense_approval_system.api.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.siva.expense_approval_system.api.dto.request.CreateUserRequest;
import com.siva.expense_approval_system.api.dto.request.CreateInvitationRequest;
import com.siva.expense_approval_system.api.dto.response.InvitationResponse;
import com.siva.expense_approval_system.api.dto.request.UpdateUserRequest;
import com.siva.expense_approval_system.api.dto.request.TransferFinanceAdminRequest;
import com.siva.expense_approval_system.api.dto.response.UserResponse;
import com.siva.expense_approval_system.api.mapper.UserMapper;
import com.siva.expense_approval_system.application.service.UserService;
import com.siva.expense_approval_system.application.service.InvitationService;
import com.siva.expense_approval_system.domain.model.Tenant;
import com.siva.expense_approval_system.domain.model.User;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import com.siva.expense_approval_system.infrastructure.security.CurrentUserService;


@RestController
@RequestMapping("/api/users")

public class UserController {

   private final UserService userService;

   private final UserMapper userMapper;

   private final CurrentUserService currentUserService;
   private final InvitationService invitationService;

   public UserController(UserService userService,CurrentUserService currentUserService,UserMapper userMapper,
           InvitationService invitationService) {
           
           this.userService = userService;
           this.currentUserService = currentUserService;
           this.userMapper = userMapper;
           this.invitationService = invitationService;
   }
    
   @PostMapping
   /* Sample JSON for Postman POST /api/users
    {
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "password": "P@ssw0rd123",
      "role": "EMPLOYEE"
    }
   */
  @PreAuthorize("hasRole('FINANCE_ADMIN')")
   public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request){

    
       Tenant tenant = currentUserService.getCurrentTenant();
        User user = userMapper.toEntityMapping(request, tenant);
        
        User savedUser = userService.createUser(user);

        UserResponse response = userMapper.toResponse(savedUser);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
   }

     @GetMapping
     @PreAuthorize("hasRole('FINANCE_ADMIN')")
     public ResponseEntity<List<UserResponse>> getAllUsers() {

         List<User> users = userService.getAllUsers();

         List<UserResponse> response = users.stream().map(userMapper :: toResponse)
                                                      .toList();

         return ResponseEntity.ok(response);
     }
     
     @GetMapping("/{id}")
     @PreAuthorize("hasRole('FINANCE_ADMIN')")
     public ResponseEntity<UserResponse> getUserById(@PathVariable Long id){

         User user = userService.getUserById((id));

         UserResponse response = userMapper.toResponse(user);

         return ResponseEntity.ok(response);
     }
     
     @PutMapping("/{id}")
     @PreAuthorize("hasRole('FINANCE_ADMIN')")
     /* Sample JSON for Postman PUT /api/users/{id}
      {
        "name": "Jane Doe Updated",
        "email": "jane.updated@example.com",
        "role": "MANAGER"
      }
     */
     public ResponseEntity<UserResponse> updateUser(@PathVariable Long id,@Valid @RequestBody UpdateUserRequest request){

         User user = userService.getUserById(id);
         
         userMapper.updateEntity(request, user);

        User updatedUser = userService.updateUser(id, user);

        UserResponse response = userMapper.toResponse(updatedUser);

        return ResponseEntity.ok(response);
         
     }

      @DeleteMapping("/{id}")
     @PreAuthorize("hasRole('FINANCE_ADMIN')")
     public ResponseEntity<Void> deleteUser(@PathVariable Long id){
            
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
     } 

     @PutMapping("/{id}/deactivate")
     @PreAuthorize("hasRole('FINANCE_ADMIN')")
     public ResponseEntity<UserResponse> deactivateUser(@PathVariable Long id) {
        return ResponseEntity.ok(userMapper.toResponse(userService.deactivateUser(id)));
     }

     @PutMapping("/{id}/reactivate")
     @PreAuthorize("hasRole('FINANCE_ADMIN')")
     public ResponseEntity<UserResponse> reactivateUser(@PathVariable Long id) {
        return ResponseEntity.ok(userMapper.toResponse(userService.reactivateUser(id)));
     }

     @PostMapping("/transfer-finance-admin")
     @PreAuthorize("hasRole('FINANCE_ADMIN')")
     public ResponseEntity<UserResponse> transferFinanceAdmin(
             @Valid @RequestBody TransferFinanceAdminRequest request) {
        return ResponseEntity.ok(userMapper.toResponse(
                userService.transferFinanceAdmin(request.getTargetUserId())));
     }

       @PostMapping("/invitations")
       @PreAuthorize("hasRole('FINANCE_ADMIN')")
       public ResponseEntity<InvitationResponse> createInvitation(
               @Valid @RequestBody CreateInvitationRequest request) {
          return ResponseEntity.status(HttpStatus.CREATED)
                  .body(invitationService.createInvitation(request));
       }

       @DeleteMapping("/invitations/{id}")
       @PreAuthorize("hasRole('FINANCE_ADMIN')")
       public ResponseEntity<Void> revokeInvitation(@PathVariable Long id) {
          invitationService.revokeInvitation(id);
          return ResponseEntity.noContent().build();
       }

       @PostMapping("/invitations/{id}/resend")
       @PreAuthorize("hasRole('FINANCE_ADMIN')")
       public ResponseEntity<InvitationResponse> resendInvitation(@PathVariable Long id) {
          return ResponseEntity.ok(invitationService.resendInvitation(id));
       }
}
