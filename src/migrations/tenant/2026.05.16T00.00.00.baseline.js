import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
    // ============================================
    // Tables with NO foreign keys first
    // ============================================

    /** TIER 1 */
    await queryInterface.createTable('Permissions', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        permission: {
            type: DataTypes.STRING,
            allowNull: false
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('Roles', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        role: {
            type: DataTypes.STRING,
            allowNull: true
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


    await queryInterface.createTable('Categories', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('UnitTypes', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('PackageTypes', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        isActive: {
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


    await queryInterface.createTable('RequisitionCategories', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('HSNs', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        hsn_code: {
            type: DataTypes.STRING(8),   // 4/6/8 digit allowed
            allowNull: false,
            unique: true
        },
        default_gst_rate: {
            type: DataTypes.DECIMAL(5, 2),  // total GST (e.g., 18.00)
            allowNull: false,
            defaultValue: 0.00
        },
        cess_rate: {        // Tobacco, Luxury goods, Some special categories
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        is_exempt: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        effective_from: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        effective_to: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    /** ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ TIER 2 ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ */
    await queryInterface.createTable('RolePermissions', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        roleId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        permissionId: {
            type: DataTypes.INTEGER,
            allowNull: false
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
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        roleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Roles',
                key: 'id'
            }
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('TenantBusinessFlows', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        node_type_code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
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


    await queryInterface.createTable('Vendors', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {}
        },
        tenant: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        linked_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "BusinessNode.id from the vendor's own tenant DB — cross-tenant reference, not a local FK"
        },
        type: {
            type: DataTypes.ENUM("vendor", "buyer"),
            allowNull: false,
            defaultValue: "vendor",
            comment: "vendor when PO is created for this vendor or buyer when SO is created for this buyer"
        },
        contact_phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        contact_email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        address: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        gst_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        license_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },
        meta: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });



    /** ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ TIER 3 ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ */
    await queryInterface.createTable('BusinessNodes', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        node_type_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        tenant_business_flow_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('Brands', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vendor_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        logo: {
            type: DataTypes.STRING,
            allowNull: true
        },
        website: {
            type: DataTypes.STRING,
            allowNull: true
        },
        origin_country: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('NodeUsers', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        store_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        department: {
            type: DataTypes.ENUM("purchase", "sales", "both"),
            defaultValue: null,
            allowNull: true
        },
        isNodeAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('NodeDetails', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {                      // this store address, state, district, lat, log
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        gst_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        license_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        meta: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('ManufacturingUnits', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        store_type: {
            type: DataTypes.ENUM("rm_store", "fg_store", "production"),
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {                 // this store -> address, state, district, lat, log, pincode
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        meta: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    /** ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ TIER 4 ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ */
    await queryInterface.createTable('Products', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        hsn_code: {
            type: DataTypes.STRING,
            allowNull: true,
            references: { model: 'HSNs', key: 'hsn_code' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        sku: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        brand_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'Brands', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        barcode: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        product_type: {
            type: DataTypes.ENUM("raw", "finished"),
            defaultValue: "raw",
            allowNull: true
        },
        package_type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        measure: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        unit_type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        reorder_level: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        has_expiry: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        shelf_life: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        mrp: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        photo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('Batches', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        // --- 1. CORE IDENTIFIERS ---
        batch_no: {
            type: DataTypes.STRING,
            allowNull: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        // --- 2. LOCATION TRACKING ---
        location_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        store_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        location_type: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: false,
        },

        // --- 3. QUANTITIES ---
        available_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        reserved_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },

        // --- 4. AUDIT & REFERENCES ---
        reference_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reference_type: {
            type: DataTypes.ENUM("opening_stock", "grn", "transfer", "others", "production"),
            allowNull: true,
        },

        // --- 5. METADATA & STATUS ---
        batch_status: {
            type: DataTypes.ENUM("active", "quarantine", "expired", "consumed"),
            allowNull: true,
            defaultValue: "active",
        },
        unit_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        mfg_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        received_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('CategoryProducts', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('Requisitions', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        requisition_no: {
            type: DataTypes.STRING,
            unique: true
        },
        buyer_business_node_id: {        // Location A (requester)
            type: DataTypes.INTEGER,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        grandTotal: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true
        },
        requisition_category_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        type: {
            type: DataTypes.ENUM("internal", "external"),
            defaultValue: "external"
        },
        required_by_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM("pending", "quoted", "po_created", "cancelled", "closed", "bpo_created", "assign_fg", "dispatched"),
            defaultValue: "pending"
        },
        priority: {
            type: DataTypes.ENUM("low", "normal", "high"),
            defaultValue: "normal"
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('NodeStockLedgers', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        ledger_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        transaction_type: {
            type: DataTypes.ENUM("opening_stock", "internal_transfer", "external_transfer", "others"),
            allowNull: false,
        },
        txn_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },

        from_location_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        from_location_type: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: true,
        },

        to_location_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        to_location_type: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: true,
        },

        reference_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reference_type: {
            type: DataTypes.ENUM("transfer_order", "grn", "sales_order", "others"),
            allowNull: true,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });



    /** ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ TIER 5 ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ */
    await queryInterface.createTable('RequisitionItems', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        requisition_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        brand: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        sub_category: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        price_limit: {
            type: DataTypes.DECIMAL(18, 2),
            defaultValue: 0.00,
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('NodeStockLedgerItems', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        ledger_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        unit_type: {
            type: DataTypes.STRING,     // kg | litre | pcs | box etc
            allowNull: false,
        },
        unit_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
        },
        total_value: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('BOMs', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        finished_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        finished_product_barcode: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        output_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        output_uom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('BOMItems', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        bom_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        raw_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        required_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        uom: {
            type: DataTypes.STRING,
            allowNull: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('Quotations', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        quotation_no: {
            type: DataTypes.STRING,
            unique: true
        },
        requisition_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        },
        type: {
            type: DataTypes.ENUM("internal", "external"),
            defaultValue: "external"
        },
        from_supplier_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        to_business_node_id: {   // Location A (requester)
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM("draft", "submitted", "accepted", "rejected", "expired"),
            defaultValue: "draft"
        },
        valid_till: {
            type: DataTypes.DATE,
            allowNull: true
        },
        revision_no: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        grandTotal: {
            type: DataTypes.DECIMAL(18, 2),
            defaultValue: 0
        },
        note: {
            type: DataTypes.TEXT
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('SalesOrders', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        so_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        // Changed to String to capture the Buyer's actual PO Number, not their local DB ID
        source_po_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // Link back to the master contract in the Central DB
        central_bpo_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        central_indent_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        priority: {
            type: DataTypes.ENUM("low", "medium", "high", "urgent"),
            defaultValue: "medium"
        },

        // Internal Node ID of the company/location selling the goods
        seller_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        // Central/Internal Node ID of the company/location buying the goods
        buyer_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM("internal", "external", "bpo_release"),
            defaultValue: "external"
        },


        // Captures the destination RM Store selected by the buyer
        delivery_address: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        required_by: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM("draft", "waiting_for_approval", "approved", "assign_fg", "closed", "cancelled"),
            defaultValue: "draft"
        },
        grand_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        meta: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.createTable('GRNs', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });



    /** ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ TIER 6 ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ */
    await queryInterface.createTable('QuotationItems', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        quotation_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Quotations', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        requisition_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'RequisitionItems', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        offer_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false
        },
        tax_percent: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0.00
        },
        total_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('RequisitionSuppliers', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        requisition_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Requisitions', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        supplier_business_node_id: {       // Location B (supplier Internal)
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'BusinessNodes', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        status: {
            type: DataTypes.ENUM("sent", "viewed", "quoted", "accepted", "rejected", "assign_fg"),
            defaultValue: "sent",
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('PurchasOrders', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        po_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },

        // --- NEW BPO LINKAGE FIELDS ---
        central_bpo_id: {
            type: DataTypes.INTEGER,
            allowNull: true // Only filled if generated from BPO
        },
        central_indent_id: {
            type: DataTypes.INTEGER,
            allowNull: true // Only filled if generated from indent
        },

        target_store_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        priority: {
            type: DataTypes.ENUM("low", "medium", "high", "urgent"),
            defaultValue: "medium"
        },
        required_by: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        // --- MODIFIED EXISTING FIELDS ---
        quotation_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // MUST BE NULLABLE for BPO Indents
            references: { model: 'Quotations', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        requisition_id: {
            type: DataTypes.INTEGER,
            allowNull: true,  // BPO Indents don't always have a direct PR 
            references: { model: 'Requisitions', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        // --- REMAINING FIELDS ---
        from_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'BusinessNodes', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        type: {
            type: DataTypes.ENUM("internal", "external", "bpo_release"),
            allowNull: false,
            defaultValue: "internal"
        },
        to_supplier_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM("draft", "sent_to_supplier", "waiting_for_poi", "poi_received", "approved", "picking_in_progress", "closed", "cancelled"),
            defaultValue: "draft"
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        grand_total: {
            type: DataTypes.DECIMAL(18, 2),
            defaultValue: 0.00
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('SalesOrderItems', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        sales_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'SalesOrders', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        vendor_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Products', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        unit_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false
        },
        line_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('GRNItems', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        grn_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'GRNs', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        purchase_order_item_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'PurchaseOrderItems', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Products', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        ordered_qty: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
            defaultValue: 0
        },
        shortage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        },
        damage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        },
        received_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('Outwards', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        outward_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        // Link to the associated Sales Order when type is external
        sales_order_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'SalesOrders', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },

        // Link to the associated Purchase Requisition when type is internal
        pr_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },


        // Internal Node ID of the company/location selling the goods
        seller_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'BusinessNodes', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        // FG Store ID who selling the goods
        store_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'ManufacturingUnits', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        // this will may target both node or vendor
        buyer_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM("internal", "external"),
            defaultValue: "internal"
        },


        // User assigned to pick the items
        picker_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        priority: {
            type: DataTypes.ENUM("low", "medium", "high", "urgent"),
            defaultValue: "medium"
        },
        status: {
            type: DataTypes.ENUM("pending", "picking", "picked", "cancelled", "dispatched"),
            defaultValue: "pending"
        },
        required_by: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        dispatch_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        meta: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('TransferOrders', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        transfer_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        type: {
            type: DataTypes.ENUM("material_issue", "production_transfer"),
            allowNull: true,
        },

        /******************* Transfer Order Request Creater *******************/
        from_parent_node_id: {              // business node id (OPTIONAL)
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        from_location_id: {                 // manufacturing unit / store id
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        from_location_type: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: false,
            defaultValue: "mfg_unit"
        },

        /******************* Transfer Order Request Fulfiller *******************/
        to_parent_node_id: {                // business node id (OPTIONAL)
            type: DataTypes.INTEGER,
            allowNull: true
        },
        to_location_id: {                   // manufacturing unit / store id
            type: DataTypes.INTEGER,
            allowNull: false
        },
        to_location_type: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: true,
            defaultValue: "mfg_unit"
        },

        required_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM("draft", "requested", "dispatched", "received", "returns", "cancelled"),
            allowNull: true
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('ProductionOrders', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        production_order_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'BusinessNodes', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        mfg_location_id: {
            type: DataTypes.INTEGER,
            allowNull: false, // The WIP/Production unit making the goods
            references: { model: 'ManufacturingUnits', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        target_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false, // The final Finished Good (FG) product ID
            references: { model: 'Products', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        planned_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        produced_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00 // Increments as FG Store releases the goods
        },
        wasted_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        part: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM("draft", "planned", "in_progress", "completed", "cancelled"),
            defaultValue: "draft"
        },
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        completion_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });



    /** ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ TIER 7 ⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠⨠ */
    await queryInterface.createTable('PurchaseOrderItems', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        purchase_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'PurchaseOrders', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        bpo_item_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Filled if generated from BPO
        },
        buyer_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Products', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        unit_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false
        },
        tax_percent: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true
        },
        line_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('GRNItemBatches', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        grn_item_id: {              // FK → GRNItem
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'GRNItems', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        batch_no: {                 // supplier's batch number if available
            type: DataTypes.STRING,
            allowNull: true
        },
        received_qty: {             // qty in THIS batch
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        damage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('OutwardItems', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        outward_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Outwards', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        sales_order_item_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'SalesOrderItems', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        vendor_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Products', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        requested_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        dispatch_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        unit_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('OutwardAllocations', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        outward_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'OutwardItems', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Products', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Batches', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        allocated_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("allocated", "picked", "dispatched"),
            defaultValue: "allocated"
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('TransferOrderItems', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        transfer_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'TransferOrders', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Products', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        requested_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        dispatched_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        received_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('TransferOrderAllocations', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        transferOrder_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'TransferOrderItems', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Batches', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        demaged_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        shortage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        allocated_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('ProductionOrderItems', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        production_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false, // Links to the parent Production Order
            references: { model: 'ProductionOrders', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        rm_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false, // The specific Raw Material required
            references: { model: 'Products', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        required_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00 // How much RM is needed total
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });


    await queryInterface.createTable('ProductionReceipts', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        receipt_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        production_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false, // Link back to the instruction
            references: { model: 'ProductionOrders', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        fg_store_id: {
            type: DataTypes.INTEGER,
            allowNull: false, // The destination location (FG Store)
            references: { model: 'ManufacturingStores', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false, // The Finished Good being handed over
            references: { model: 'Products', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        batch_no: {
            type: DataTypes.STRING,
            allowNull: true
        },
        send_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        received_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        dmg_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        short_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        mfg_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM("pending", "accepted", "rejected"),
            defaultValue: "pending"
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
}

export async function down({ context: queryInterface }) {
    // Drop in REVERSE order (children first, parents last)
    await queryInterface.dropTable('Products');
    // ... all other tables ...
    await queryInterface.dropTable('Roles');
    await queryInterface.dropTable('Permissions');
}
