package com.siva.expense_approval_system.application.impl;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;

import java.time.LocalDateTime;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.MailSendException;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class InvitationNotificationServiceImplTest {

    @Mock
    private ObjectProvider<JavaMailSender> provider;
    @Mock
    private JavaMailSender mailSender;

    private InvitationNotificationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new InvitationNotificationServiceImpl(provider);
        ReflectionTestUtils.setField(service, "invitationAcceptUrl", "https://app.example/invite");
        ReflectionTestUtils.setField(service, "fromAddress", "no-reply@example.com");
    }

    @Test
    void invitationContainsAcceptanceUrlAndExpirationWithoutLoggingSecret() throws Exception {
        MimeMessage message = new MimeMessage(Session.getInstance(System.getProperties()));
        when(provider.getIfAvailable()).thenReturn(mailSender);
        when(mailSender.createMimeMessage()).thenReturn(message);

        service.sendInvitation("invitee@example.com", "raw-secret-token",
                LocalDateTime.of(2026, 11, 4, 12, 30));

        String content = String.valueOf(message.getContent());
        assertTrue(content.contains("https://app.example/invite?token=raw-secret-token"));
        assertTrue(content.contains("2026-11-04T12:30"));
        verify(mailSender).send(message);
    }

    @Test
    void failsClearlyWhenMailIsNotConfigured() {
        when(provider.getIfAvailable()).thenReturn(null);

        assertThrows(IllegalStateException.class,
                () -> service.sendInvitation("invitee@example.com", "token", LocalDateTime.now()));
    }

    @Test
    void surfacesMailProviderFailure() {
        when(provider.getIfAvailable()).thenReturn(mailSender);
        when(mailSender.createMimeMessage()).thenReturn(
                new MimeMessage(Session.getInstance(System.getProperties())));
        doThrow(new MailSendException("SMTP unavailable"))
                .when(mailSender).send(org.mockito.ArgumentMatchers.any(MimeMessage.class));

        assertThrows(IllegalStateException.class,
                () -> service.sendInvitation("invitee@example.com", "token", LocalDateTime.now()));
    }
}
