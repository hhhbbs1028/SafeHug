package com.capstone.SafeHug.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
public class UserSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "profile_name")
    private String profileName;

    @Column(name = "profile_email")
    private String profileEmail;

    @Column(name = "profile_phone")
    private String profilePhone;

    @Enumerated(EnumType.STRING)
    @Column(name = "social_linked")
    private User.SocialType socialLinked;

    @Column(name = "password_changed")
    private boolean passwordChanged = false;

    @Column(name = "two_factor_auth")
    private boolean twoFactorAuth = false;

    @Column(name = "last_login_devices", columnDefinition = "TEXT")
    private String lastLoginDevices;

    @Column(name = "email_notifications")
    private boolean emailNotifications = true;

    @Column(name = "sms_notifications")
    private boolean smsNotifications = true;

    @Column(name = "new_device_alerts")
    private boolean newDeviceAlerts = true;

    @Column(name = "service_updates")
    private boolean serviceUpdates = true;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
} 