package com.siva.expense_approval_system.api.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class UpdateExpenseRequest {
     
     
    @Positive(message ="amount must be greater than zero")
     private BigDecimal amount;

    @NotBlank(message = "Description is required")
     private String Description;

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return Description;
    }

    public void setDescription(String description) {
        Description = description;
    }

     
}
