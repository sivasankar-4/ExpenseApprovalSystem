package com.siva.expense_approval_system.api.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ExpenseResponse {
    

     private Long id;

     private String submittedBy;

     private BigDecimal amount;

     private String description;

     private String status;

     private String tenantName;

     private LocalDateTime createdAt;

     public Long getId() {
        return id;
    }

     public void setId(Long id) {
         this.id = id;
     }

     public String getSubmittedBy() {
         return submittedBy;
     }

     public void setSubmittedBy(String submittedBy) {
         this.submittedBy = submittedBy;
     }

     public BigDecimal getAmount() {
         return amount;
     }

     public void setAmount(BigDecimal amount) {
         this.amount = amount;
     }

     public String getDescription() {
         return description;
     }

     public void setDescription(String description) {
         this.description = description;
     }

     public String getStatus() {
         return status;
     }

     public void setStatus(String status) {
         this.status = status;
     }

     public String getTenantName() {
         return tenantName;
     }

     public void setTenantName(String tenantName) {
         this.tenantName = tenantName;
     }

     public LocalDateTime getCreatedAt() {
         return createdAt;
     }

     public void setCreatedAt(LocalDateTime createdAt) {
         this.createdAt = createdAt;
     }

     

}
