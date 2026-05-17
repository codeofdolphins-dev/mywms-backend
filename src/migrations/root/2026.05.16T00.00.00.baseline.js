import { DataTypes } from "sequelize";

export async function up({ context: queryInterface }) {

    await queryInterface.createTable("States", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable("Districts", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: {
            type: DataTypes.STRING,
        },
        state_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable("Permissions", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        permission: {
            type: DataTypes.STRING,
            allowNull: false
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable("Roles", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        role: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('RolePermissions', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        roleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Roles', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        permissionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Permissions', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('Users', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        company_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        phone_no: {
            type: DataTypes.STRING,
            allowNull: true
        },
        profile_image: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
        accessToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        type: {
            type: DataTypes.ENUM("internal", "external"),
            defaultValue: "internal"
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        is_owner: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        meta: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.createTable('UserRoles', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        roleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Roles', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('TenantsNames', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        tenant: {
            type: DataTypes.STRING,
            require: true,
            allowNull: false,
            unique: true,
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('Tenants', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        tenant_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'TenantsNames', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true
        },
        companyName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isOwner: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('BusinessNodeTypes', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('TenantBusinessFlowMasters', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        tenant_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'TenantsNames', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        node_type_code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        sequence: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    /** add indexes */
    await queryInterface.addIndex('TenantBusinessFlowMasters', ['tenant_id', 'node_type_code'], {
        name: "uniq_tenant_node_type",
        unique: true
    });


    await queryInterface.createTable('RFQs', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        rfq_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        buyer_tenant: {
            type: DataTypes.STRING,
            allowNull: false,
            references: { model: 'TenantsNames', key: 'tenant' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        pr_reference_code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        priority: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("draft", "open", "closed", "cancelled"),
            defaultValue: "open",
        },
        submission_deadline: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        grand_total: {
            type: DataTypes.DECIMAL(18, 2),
            defaultValue: 0.00,
        },
        meta: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('RFQItems', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        rfq_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'RFQs', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        product_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        uom: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        price_limit: {
            type: DataTypes.DECIMAL(18, 2),
            defaultValue: 0.00,
            allowNull: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('RfqQuotations', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        rfq_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'RFQs', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        vendor_tenant: {
            type: DataTypes.STRING,
            allowNull: false,
            references: { model: 'TenantsNames', key: 'tenant' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        buyer_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("accept", "reject"),
            allowNull: true,
        },
        current_revision_no: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        valid_till: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        meta: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('RfqQuotationRevisions', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        quotation_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'RfqQuotations', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        revision_no: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        status: {
            type: DataTypes.ENUM("draft", "sent", "negotiate", "confirmed", "pending", "closed", "cancelled"),
            defaultValue: "sent",
        },
        grand_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });



    await queryInterface.createTable('BlanketOrders', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        bpo_no: {
            type: DataTypes.STRING,
            unique: true
        },
        pr_reference_code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        buyer_tenant: {
            type: DataTypes.STRING,
            allowNull: false,
            references: { model: 'TenantsNames', key: 'tenant' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        vendor_tenant: {
            type: DataTypes.STRING,
            allowNull: false,
            references: { model: 'TenantsNames', key: 'tenant' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        rfq_quotation_revision_id: {
            type: DataTypes.INTEGER,
            references: { model: 'RfqQuotationRevisions', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        status: {
            type: DataTypes.ENUM('draft', 'active', 'closed'),
            defaultValue: 'draft'
        },
        valid_until: {
            type: DataTypes.DATEONLY
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('BlanketOrderItems', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        bpo_id: {
            type: DataTypes.INTEGER,
            references: { model: 'BlanketOrders', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        buyer_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        vendor_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        total_contracted_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        consumed_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        },
        remain_contracted_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        unit_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('BpoIndents', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        indent_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        bpo_id: {
            type: DataTypes.INTEGER,
            allowNull: false, // Links to BlanketOrders
            references: { model: 'BlanketOrders', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        buyer_tenant: {
            type: DataTypes.STRING,
            allowNull: false,
            references: { model: 'TenantsNames', key: 'tenant' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        vendor_tenant: {
            type: DataTypes.STRING,
            allowNull: false,
            references: { model: 'TenantsNames', key: 'tenant' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        // --- The Crucial Links ---
        buyer_po_id: {
            type: DataTypes.INTEGER,
            allowNull: true // Populated after the local PO is created
        },
        supplier_so_id: {
            type: DataTypes.INTEGER,
            allowNull: true // Populated after the local SO is created
        },
        status: {
            type: DataTypes.ENUM("draft", "confirmed", "fulfilled", "cancelled"),
            defaultValue: "confirmed"
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        grand_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('BpoIndentItems', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        indent_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'BpoIndents', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        bpo_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false, // Links to BlanketOrderItems
            references: { model: 'BlanketOrderItems', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        release_qty: {
            type: DataTypes.DECIMAL(10, 2), // RM precision
            allowNull: false
        },
        unit_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false // Locked in from the BPO
        },
        line_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('ProductMappings', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        buyer_node: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vendor_node: {
            type: DataTypes.STRING,
            allowNull: false
        },
        buyer_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        vendor_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('RfqQuotationItems', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        revision_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'RfqQuotationRevisions', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        rfq_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'RFQItems', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        product_map_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'ProductMappings', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        offer_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
}

export async function down({ context: queryInterface }) {
    await queryInterface.dropTable('RfqQuotationItems');
    await queryInterface.dropTable('ProductMappings');
    await queryInterface.dropTable('BpoIndentItems');
    await queryInterface.dropTable('BpoIndents');
    await queryInterface.dropTable('BlanketOrderItems');
    await queryInterface.dropTable('BlanketOrders');
    await queryInterface.dropTable('RfqQuotationRevisions');
    await queryInterface.dropTable('RfqQuotations');
    await queryInterface.dropTable('RFQItems');
    await queryInterface.dropTable('RFQs');
    await queryInterface.dropTable('TenantBusinessFlowMasters');
    await queryInterface.dropTable('BusinessNodeTypes');
    await queryInterface.dropTable('Tenants');
    await queryInterface.dropTable('TenantsNames');
    await queryInterface.dropTable('UserRoles');
    await queryInterface.dropTable('Users');
    await queryInterface.dropTable('RolePermissions');
    await queryInterface.dropTable('Roles');
    await queryInterface.dropTable('Permissions');
}