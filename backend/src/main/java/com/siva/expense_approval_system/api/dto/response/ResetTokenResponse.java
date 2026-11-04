package com.siva.expense_approval_system.api.dto.response;

public class ResetTokenResponse {
     

     private String resetToken;

     public ResetTokenResponse(String resetToken) {
        this.resetToken = resetToken;
     }

     public String getResetToken(){
        return resetToken;
     }

     public void setResetToken(String resetToken){
        this.resetToken = resetToken;
     }
         
}
