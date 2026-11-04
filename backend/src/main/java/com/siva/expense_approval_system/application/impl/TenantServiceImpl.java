package com.siva.expense_approval_system.application.impl;

import java.util.List;
//import java.util.Objects;

import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.siva.expense_approval_system.application.service.TenantService;
import com.siva.expense_approval_system.domain.model.Tenant;
import com.siva.expense_approval_system.domain.repository.TenantRepository;
import com.siva.expense_approval_system.infrastructure.security.CurrentUserService;

@Service
public class TenantServiceImpl implements TenantService{
    
   
    private final TenantRepository tenantRepository;
    private final CurrentUserService currentUserService;

    public TenantServiceImpl(TenantRepository tenantRepository, CurrentUserService currentUserService){

        this.tenantRepository = tenantRepository;
        this.currentUserService = currentUserService;
    }
    
    @Override
    public Tenant createTenant(@NonNull Tenant tenant){
        return tenantRepository.save(tenant);

    }
    
    @Override
    public Tenant getTenantById(@NonNull Long id){
        Tenant currentTenant = getCurrentTenant();
        if (!currentTenant.getId().equals(id)) {
            throw new AccessDeniedException("Tenant not found or does not belong to the current user.");
        }
        return currentTenant;
    }
   
     @Override
    public List<Tenant> getAllTenants() {
        return List.of(getCurrentTenant());
    }

    @Override
    public Tenant updateTenant(@NonNull Long id, @NonNull Tenant tenant){
        
         Tenant existingTenant = getTenantById(id);
         existingTenant.setName(tenant.getName());
         return tenantRepository.save(existingTenant);
    }


    @Override
    public void deleteTenant(@NonNull Long id){

        Tenant tenant = getTenantById(id);

        tenantRepository.delete(tenant);
    }

    private Tenant getCurrentTenant() {
        Tenant currentTenant = currentUserService.getCurrentTenant();
        if (currentTenant == null || currentTenant.getId() == null) {
            throw new AccessDeniedException("Current user is not associated with a tenant.");
        }
        return currentTenant;
    }

}
