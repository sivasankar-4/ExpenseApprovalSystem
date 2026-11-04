package com.siva.expense_approval_system.api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.siva.expense_approval_system.api.dto.request.CreateTenantRequest;
import com.siva.expense_approval_system.api.dto.request.UpdateTenantRequest;
import com.siva.expense_approval_system.api.dto.response.TenantResponse;
import com.siva.expense_approval_system.api.mapper.TenantMapper;
import com.siva.expense_approval_system.application.service.TenantService;
import com.siva.expense_approval_system.domain.model.Tenant;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/tenants")
public class TenantController {

     private final TenantService tenantService;

     private final TenantMapper tenantMapper;

     public TenantController(TenantService tenantService, TenantMapper tenantMapper) {
        this.tenantService = tenantService;
        this.tenantMapper = tenantMapper;
     }
    
     @PostMapping
     @PreAuthorize("hasRole('FINANCE_ADMIN')")
     public ResponseEntity<TenantResponse> createTenant(@Valid @RequestBody CreateTenantRequest request){

         Tenant tenant = tenantMapper.toEntity(request);

         Tenant savedTenant = tenantService.createTenant(tenant);
       
        TenantResponse response = tenantMapper.toResponse(savedTenant);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
     }

     @GetMapping
     @PreAuthorize("hasRole('FINANCE_ADMIN')")
     public ResponseEntity<List<TenantResponse>> getAllTenants(){
     
        List<Tenant> tenants = tenantService.getAllTenants();

        List<TenantResponse> response = tenants.stream().map(tenantMapper :: toResponse).toList();

        return ResponseEntity.ok(response);  
     }
     
     @GetMapping("/{id}")
     @PreAuthorize("hasRole('FINANCE_ADMIN')")
     public ResponseEntity<TenantResponse> getTenantById(@PathVariable Long id){
           
        Tenant tenant = tenantService.getTenantById((id));

        TenantResponse tenantResponse = tenantMapper.toResponse(tenant);

        return ResponseEntity.ok(tenantResponse);

     }
   
     @PutMapping("/{id}")
     @PreAuthorize("hasRole('FINANCE_ADMIN')")
     public ResponseEntity<TenantResponse> updateTenant(@PathVariable Long id, @Valid @RequestBody UpdateTenantRequest request){
        
         Tenant tenant = tenantService.getTenantById(id);
         tenantMapper.updateEntity(request, tenant);

         Tenant updatedTenant = tenantService.updateTenant(id, tenant);

         TenantResponse response = tenantMapper.toResponse(updatedTenant);

         return ResponseEntity.ok(response);
     }
     
     @DeleteMapping("/{id}")
     @PreAuthorize("hasRole('FINANCE_ADMIN')")

     public ResponseEntity<Void> deleteTenant(@PathVariable Long id){

         tenantService.deleteTenant(id);
         return ResponseEntity.noContent().build();
     }

}
