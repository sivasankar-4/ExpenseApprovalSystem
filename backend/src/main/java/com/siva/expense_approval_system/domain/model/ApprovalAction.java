package com.siva.expense_approval_system.domain.model;

import java.time.LocalDateTime;

import com.siva.expense_approval_system.domain.enums.ApprovalActionStatus;

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
import jakarta.persistence.UniqueConstraint;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "approval_action", uniqueConstraints = @UniqueConstraint(
        name = "uk_approval_action_expense_step",
        columnNames = {"expense_id", "workflow_step"}))
@NoArgsConstructor
public class ApprovalAction {
    

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long Id;
       
    @ManyToOne
    @JoinColumn(name ="expense_id",nullable = false)
    private Expense expense;
    
    @ManyToOne
    @JoinColumn(name ="approver_id",nullable = false)
    private User approver;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApprovalActionStatus action;

    @Column(name = "workflow_step", nullable = false)
    private Integer workflowStep;
    
    @Column(length = 500)
    private String comment;
    
    @Column(name = "acted_at",nullable = false)
    private LocalDateTime actedAt;

    public ApprovalAction(Long id, Expense expense, User approver, ApprovalActionStatus action, Integer workflowStep, String comment,
            LocalDateTime actedAt) {
        Id = id;
        this.expense = expense;
        this.approver = approver;
        this.action = action;
        this.workflowStep = workflowStep;
        this.comment = comment;
        this.actedAt = actedAt;
    }


    public Long getId() {
        return Id;
    }


    public void setId(Long id) {
        Id = id;
    }


    public Expense getExpense() {
        return expense;
    }


    public void setExpense(Expense expense) {
        this.expense = expense;
    }


    public User getApprover() {
        return approver;
    }


    public void setApprover(User approver) {
        this.approver = approver;
    }


    public ApprovalActionStatus getAction() {
        return action;
    }


    public void setAction(ApprovalActionStatus action) {
        this.action = action;
    }

    public Integer getWorkflowStep() {
        return workflowStep;
    }

    public void setWorkflowStep(Integer workflowStep) {
        this.workflowStep = workflowStep;
    }


    public String getComment() {
        return comment;
    }


    public void setComment(String comment) {
        this.comment = comment;
    }


    public LocalDateTime getActedAt() {
        return actedAt;
    }


    public void setActedAt(LocalDateTime actedAt) {
        this.actedAt = actedAt;
    }

    

}
