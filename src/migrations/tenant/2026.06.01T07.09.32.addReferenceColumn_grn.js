import { DataTypes } from 'sequelize';

/** Migration: addReferenceColumn_grn */

export async function up({ context: queryInterface }) {
    // Write your migration here
    await queryInterface.addColumn('GRNs', 'reference', {
        type: DataTypes.JSONB,
        defaultValue: {}
    });
}

export async function down({ context: queryInterface }) {
    // Write the reverse of up() here
    await queryInterface.removeColumn('GRNs', 'reference');
}
