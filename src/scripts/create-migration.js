import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [, , type, ...nameParts] = process.argv;
const name = nameParts.join('-');

if (!type || !name || !['root', 'tenant'].includes(type)) {
    console.log('Usage: node src/scripts/create-migration.js <root|tenant> <migration-name>');
    console.log('Example: node src/scripts/create-migration.js tenant add-shelf-life-to-product');
    process.exit(1);
}

const now = new Date();
const timestamp = now.toISOString()
    .replace(/-/g, '.')
    .replace(/:/g, '.')
    .slice(0, 19);   // "2026.05.16T22.30.00"

const fileName = `${timestamp}.${name}.js`;
const filePath = path.join(__dirname, `../migrations/${type}/${fileName}`);

const template = `import { DataTypes } from 'sequelize';

/** Migration: ${name} */

export async function up({ context: queryInterface }) {
// Write your migration here
    // Example: Add a column
    // await queryInterface.addColumn('Products', 'shelf_life', {
    //     type: DataTypes.INTEGER,
    //     allowNull: true,
    //     defaultValue: 0,
    // });
}

export async function down({ context: queryInterface }) {
    // Write the reverse of up() here
    // Example: Remove the column
    // await queryInterface.removeColumn('Products', 'shelf_life');
}
`;

fs.writeFileSync(filePath, template);
console.log(`✅ Created: ${filePath}`);
