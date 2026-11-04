package com.siva.expense_approval_system.api.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CreateTenantRequest {
    
      @NotBlank(message = "name is Required")
      private String name;

      public String getName() {
          return name;
      }

      public void setName(String name) {
          this.name = name;
      }



}
