import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
    // ============================================
    // Tables with NO foreign keys first
    // ============================================

    /** TIER 1 */
    await queryInterface.createTable('Permissions', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.createTable('Roles', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.STRING, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.createTable('Categories', {});
    await queryInterface.createTable('UnitTypes', {});
    await queryInterface.createTable('PackageTypes', {});
    await queryInterface.createTable('BusinessNodeTypes', {});
    await queryInterface.createTable('RequisitionCategories', {});
    await queryInterface.createTable('HSNs', {});

    /** TIER 2 */
    await queryInterface.createTable('RolePermissions', {});
    await queryInterface.createTable('Users', {});
    await queryInterface.createTable('UserRoles', {});
    await queryInterface.createTable('TenantBusinessFlows', {});
    await queryInterface.createTable('Vendors', {});

    /** TIER 3 */
    await queryInterface.createTable('BusinessNodes', {});
    await queryInterface.createTable('Brands', {});
    await queryInterface.createTable('NodeUsers', {});
    await queryInterface.createTable('NodeDetails', {});
    await queryInterface.createTable('ManufacturingUnits', {});

    /** TIER 4 */
    await queryInterface.createTable('Products', {});
    await queryInterface.createTable('Batches', {});
    await queryInterface.createTable('CategoryProducts', {});
    await queryInterface.createTable('Requisitions', {});
    await queryInterface.createTable('NodeStockLedgers', {});

    /** TIER 5 */
    await queryInterface.createTable('RequisitionItems', {});
    await queryInterface.createTable('NodeStockLedgerItems', {});
    await queryInterface.createTable('BOMs', {});
    await queryInterface.createTable('BOMItems', {});
    await queryInterface.createTable('Quotations', {});
    await queryInterface.createTable('SalesOrders', {});
    await queryInterface.createTable('GRNs', {});

    /** TIER 6 */
    await queryInterface.createTable('QuotationItems', {});
    await queryInterface.createTable('RequisitionSuppliers', {});
    await queryInterface.createTable('PurchasOrders', {});
    await queryInterface.createTable('SalesOrderItems', {});
    await queryInterface.createTable('GRNItems', {});
    await queryInterface.createTable('Outwards', {});
    await queryInterface.createTable('TransferOrders', {});
    await queryInterface.createTable('ProductionOrders', {});

    /** TIER 7 */
    await queryInterface.createTable('PurchaseOrderItems', {});
    await queryInterface.createTable('GRNItemBatches', {});
    await queryInterface.createTable('OutwardItems', {});
    await queryInterface.createTable('OutwardAllocations', {});
    await queryInterface.createTable('TransferOrderItems', {});
    await queryInterface.createTable('TransferOrderAllocations', {});
    await queryInterface.createTable('ProductionOrderItems', {});
    await queryInterface.createTable('ProductionReceipts', {});
    await queryInterface.createTable('Invoices', {});
    await queryInterface.createTable('InvoiceItems', {});

    // ... continue for each model ...

    // ============================================
    // Tables WITH foreign keys (after their parents exist)
    // ============================================

    await queryInterface.createTable('Products', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        brand_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'Brands', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        // ... all other columns ...
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    // ... continue for remaining models ...
}

export async function down({ context: queryInterface }) {
    // Drop in REVERSE order (children first, parents last)
    await queryInterface.dropTable('Products');
    // ... all other tables ...
    await queryInterface.dropTable('Roles');
    await queryInterface.dropTable('Permissions');
}
