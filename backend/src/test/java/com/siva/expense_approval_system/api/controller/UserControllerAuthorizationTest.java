package com.siva.expense_approval_system.api.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.lang.reflect.Method;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

class UserControllerAuthorizationTest {

    @Test
    void lifecycleAndInvitationEndpointsRequireFinanceAdmin() throws Exception {
        assertFinanceAdmin("deactivateUser", Long.class);
        assertFinanceAdmin("reactivateUser", Long.class);
        assertFinanceAdmin("transferFinanceAdmin",
                com.siva.expense_approval_system.api.dto.request.TransferFinanceAdminRequest.class);
        assertFinanceAdmin("createInvitation",
                com.siva.expense_approval_system.api.dto.request.CreateInvitationRequest.class);
        assertFinanceAdmin("revokeInvitation", Long.class);
        assertFinanceAdmin("resendInvitation", Long.class);
    }

    private void assertFinanceAdmin(String methodName, Class<?> parameterType) throws Exception {
        Method method = UserController.class.getDeclaredMethod(methodName, parameterType);
        PreAuthorize authorization = method.getAnnotation(PreAuthorize.class);
        assertNotNull(authorization, methodName + " must declare method authorization");
        assertEquals("hasRole('FINANCE_ADMIN')", authorization.value());
    }
}
