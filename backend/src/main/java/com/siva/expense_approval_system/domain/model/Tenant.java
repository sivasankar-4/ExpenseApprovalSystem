package com.siva.expense_approval_system.domain.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tenants")
@NoArgsConstructor
public class Tenant{
        
     @Id
     @GeneratedValue(strategy =  GenerationType.IDENTITY)
     private Long Id;
    
    @Column(nullable = false)
     private String name;
     
     @Column(name = "created_at" ,nullable = false)
     private LocalDateTime createdAt;

      
     public Tenant(Long Id,String name,LocalDateTime createdAt){
         
          this.Id = Id;
          this.name = name;
          this.createdAt = createdAt;
     }

     public Long getId(){
        return Id;
     }

     public void setId(Long Id){
      this.Id = Id;
     }

     public String getName(){
        return name;

     }

     public void setName(String name){
        this.name = name;
     }

     public LocalDateTime created_at(){
        return createdAt;
     }

     public void setcreated_At(LocalDateTime createdAt){
      this.createdAt = createdAt;
     }


}