package com.siva.expense_approval_system.api.mapper;

import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.siva.expense_approval_system.api.dto.request.CreateTenantRequest;
import com.siva.expense_approval_system.api.dto.request.UpdateTenantRequest;
import com.siva.expense_approval_system.api.dto.response.TenantResponse;
import com.siva.expense_approval_system.domain.model.Tenant;

@Component
public class TenantMapper {

    public Tenant toEntity(CreateTenantRequest request){

         Tenant tenant = new Tenant();

         tenant.setName(request.getName());
         tenant.setcreated_At(LocalDateTime.now());

         return tenant;
    }

    public void updateEntity(UpdateTenantRequest request,Tenant tenant){

         tenant.setName(request.getName());
    }

    public TenantResponse toResponse(Tenant tenant){

         TenantResponse response = new TenantResponse();

         response.setId(tenant.getId());
         response.setName(tenant.getName());

         return response;
    }

}
