package com.siva.expense_approval_system.application.exception;

public class WorkflowValidationException extends RuntimeException {

    public WorkflowValidationException(String message) {
        super(message);
    }
}
