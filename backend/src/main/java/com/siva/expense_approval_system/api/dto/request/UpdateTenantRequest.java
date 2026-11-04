package com.siva.expense_approval_system.api.dto.request;

import jakarta.validation.constraints.NotBlank;

public class UpdateTenantRequest {
    
    @NotBlank(message = "Name is required")
     private String name;

     public String getName() {
         return name;
     }

     public void setName(String name) {
         this.name = name;
     }


}
