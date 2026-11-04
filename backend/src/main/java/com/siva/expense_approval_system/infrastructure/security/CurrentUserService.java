package com.siva.expense_approval_system.infrastructure.security;

import com.siva.expense_approval_system.domain.model.Tenant;
import com.siva.expense_approval_system.domain.model.User;

public interface CurrentUserService {
    

    User getCurrentUser();
    Tenant getCurrentTenant();
}
