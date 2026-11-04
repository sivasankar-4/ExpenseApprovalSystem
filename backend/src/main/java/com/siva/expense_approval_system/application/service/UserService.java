package com.siva.expense_approval_system.application.service;

import java.util.List;

import org.springframework.lang.NonNull;

import com.siva.expense_approval_system.domain.model.User;

public interface UserService {
   
    User createUser(@NonNull User user);

    User getUserById(@NonNull Long id);

    List<User> getAllUsers();

    User updateUser(@NonNull Long id, @NonNull User user);

    void deleteUser(@NonNull Long id);

    User deactivateUser(@NonNull Long id);

    User reactivateUser(@NonNull Long id);

    User transferFinanceAdmin(@NonNull Long targetUserId);
    
} 
