/** Migration: clear-epoch-batch-dates — opening stock import turned empty Excel date cells into 1970-01-01
 * (new Date(null)); transfers then copied that expiry onward. Those dates were never real, so clear them. */

const DATE_COLUMNS = [
    { table: 'Batches', column: 'mfg_date' },
    { table: 'Batches', column: 'expiry_date' },
    { table: 'GRNItemBatches', column: 'expiry_date' },
    { table: 'ProductionReceipts', column: 'mfg_date' },
    { table: 'ProductionReceipts', column: 'expiry_date' },
    { table: 'InvoiceItems', column: 'mfg_date' },
    { table: 'InvoiceItems', column: 'expiry_date' },
];

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        for (const { table, column } of DATE_COLUMNS) {
            // < 1970-01-02 also catches timestamptz values stored as 1969-12-31T18:30Z (IST midnight)
            await queryInterface.sequelize.query(
                `UPDATE "${table}" SET "${column}" = NULL WHERE "${column}" < '1970-01-02'`,
                { transaction }
            );
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export async function down() {
    // irreversible data fix — the cleared values were never valid dates
}
