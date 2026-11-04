package com.siva.expense_approval_system.application.impl;

import java.time.LocalDateTime;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;

import com.siva.expense_approval_system.application.service.InvitationNotificationService;

@Service
public class InvitationNotificationServiceImpl implements InvitationNotificationService {

    private static final Logger log = LoggerFactory.getLogger(InvitationNotificationServiceImpl.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.invitation.accept-url}")
    private String invitationAcceptUrl;

    @Value("${app.mail.from}")
    private String fromAddress;

    public InvitationNotificationServiceImpl(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    @Override
    public void sendInvitation(String email, String rawToken, LocalDateTime expiresAt) {
        send(email, "You are invited to Expense Approval System",
                "You have been invited to join the Expense Approval System.\n\n"
                        + "Accept your invitation: " + invitationAcceptUrl + "?token=" + rawToken + "\n"
                        + "This invitation expires at " + expiresAt + ".\n");
    }

    @Override
    public void sendAccountDeactivated(String email) {
        send(email, "Your expense account was deactivated",
                "Your expense approval account has been deactivated. Contact your Finance Admin if you need assistance.\n");
    }

    @Override
    public void sendAccountReactivated(String email) {
        send(email, "Your expense account was reactivated",
                "Your expense approval account has been reactivated.\n");
    }

    @Override
    public void sendRoleChanged(String email, String previousRole, String newRole) {
        send(email, "Your expense approval role changed",
                "Your expense approval role changed from " + previousRole + " to " + newRole + ".\n");
    }

    @Override
    public void sendFinanceAdminTransfer(String outgoingEmail, String incomingEmail) {
        RuntimeException failure = null;
        if (outgoingEmail != null && !outgoingEmail.isBlank()) {
            try {
                send(outgoingEmail, "Finance Admin role transferred",
                        "Your Finance Admin role was transferred to another tenant user.\n");
            } catch (RuntimeException ex) {
                failure = ex;
            }
        }
        if (incomingEmail != null && !incomingEmail.isBlank()) {
            try {
                send(incomingEmail, "You are now a Finance Admin",
                        "You are now the Finance Admin for your tenant.\n");
            } catch (RuntimeException ex) {
                if (failure == null) {
                    failure = ex;
                } else {
                    failure.addSuppressed(ex);
                }
            }
        }
        if (failure != null) {
            throw failure;
        }
    }

    private void send(String recipient, String subject, String body) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || fromAddress == null || fromAddress.isBlank()) {
            throw new IllegalStateException(
                    "Email delivery is not configured. Set MAIL_HOST, MAIL_PORT, MAIL_USERNAME, "
                            + "MAIL_PASSWORD, and MAIL_FROM.");
        }
        try {
            var message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (MessagingException | MailException ex) {
            log.error("Email delivery failed for recipient {}", recipient, ex);
            throw new IllegalStateException("Email delivery failed.", ex);
        }
    }
}
