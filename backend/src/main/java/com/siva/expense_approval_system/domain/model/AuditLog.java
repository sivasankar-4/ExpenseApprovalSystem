package com.siva.expense_approval_system.domain.model;

import java.time.LocalDateTime;

import com.siva.expense_approval_system.domain.enums.AuditActionType;
import com.siva.expense_approval_system.domain.enums.AuditEntityType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "audit_log")
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long Id;
    
    @ManyToOne
    @JoinColumn(name = "tenant_id",nullable = false)
    private Tenant tenant;
    

    @Column(name = "actor_id",nullable = false)
    private Long actorId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type",nullable = false)
    private AuditActionType actionType;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type",nullable = false)
    private AuditEntityType entityType;
   
    @Column(name = "entity_id",nullable = false)
    private Long entityId;
    
    @Column(columnDefinition = "TEXT")
    private String metadata;
    
    @Column(name ="created_at",nullable = false)
    private LocalDateTime createdAt;


    public AuditLog(Long id, Tenant tenant, Long actorId, AuditActionType actionType, AuditEntityType entityType, Long entityId,
            String metadata, LocalDateTime createdAt) {
        Id = id;
        this.tenant = tenant;
        this.actorId = actorId;
        this.actionType = actionType;
        this.entityType = entityType;
        this.entityId = entityId;
        this.metadata = metadata;
        this.createdAt = createdAt;
    }



    public Long getId() {
        return Id;
    }



    public void setId(Long id) {
        Id = id;
    }



    public Tenant getTenant() {
        return tenant;
    }



    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }



    public Long getActorId() {
        return actorId;
    }



    public void setActorId(Long actorId) {
        this.actorId = actorId;
    }



    public AuditActionType getActionType() {
        return actionType;
    }



    public void setActionType(AuditActionType actionType) {
        this.actionType = actionType;
    }



    public AuditEntityType getEntityType() {
        return entityType;
    }



    public void setEntityType(AuditEntityType entityType) {
        this.entityType = entityType;
    }



    public Long getEntityId() {
        return entityId;
    }



    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }



    public String getMetaData() {
        return metadata;
    }



    public void setMetaData(String metaData) {
        this.metadata = metaData;
    }



    public LocalDateTime getCreatedAt() {
        return createdAt;
    }



    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    
}


