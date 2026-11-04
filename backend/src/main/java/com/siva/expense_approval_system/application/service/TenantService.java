package com.siva.expense_approval_system.application.service;

import java.util.List;

import org.springframework.lang.NonNull;

import com.siva.expense_approval_system.domain.model.Tenant;

public interface TenantService {


   Tenant createTenant(@NonNull Tenant tenant);

   Tenant getTenantById(@NonNull Long id);

   List<Tenant> getAllTenants();

   Tenant updateTenant(@NonNull Long id, @NonNull Tenant tenant);

   void deleteTenant(@NonNull Long id);

   

}
