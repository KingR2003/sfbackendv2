package com.deliveryapp.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "module_permissions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "module_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ModulePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "module_id", nullable = false)
    private AppModule module;

    @Column(name = "view_access")
    private boolean viewAccess = false;

    @Column(name = "create_access")
    private boolean createAccess = false;

    @Column(name = "update_access")
    private boolean updateAccess = false;

    @Column(name = "delete_access")
    private boolean deleteAccess = false;
}
