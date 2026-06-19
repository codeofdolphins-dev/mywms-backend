import { makeSlug } from "../helper/helper.js";

export async function insertBulkUnitType(models, dataSet, transaction) {
    try {
        const uniqueUnitType = [...new Set(dataSet?.map(data => data.unitType).filter(Boolean))];
        const unitType = uniqueUnitType.map(u => ({ name: u }));

        await models.UnitType.bulkCreate(unitType, {
            transaction,
            ignoreDuplicates: true
        });

    } catch (error) {
        console.log(error);
        throw error;
    }
};

export async function insertBulkPackType(models, dataSet, transaction) {
    try {
        const uniqPackType = [...new Set(dataSet?.map(data => data.packType).filter(Boolean))];
        const packType = uniqPackType.map(p => ({ name: p }));

        await models.PackageType.bulkCreate(packType, {
            transaction,
            ignoreDuplicates: true
        });

    } catch (error) {
        console.log(error);
        throw error;
    }
};

export async function insertBulkBrand(models, dataSet, transaction) {
    try {
        const uniqueBrandName = [...new Set(dataSet?.map(data => data.brand).filter(Boolean))];
        const brand = uniqueBrandName.map(b => ({ name: b, slug: makeSlug(b) }));

        await models.Brand.bulkCreate(brand, {
            transaction,
            ignoreDuplicates: true
        });

    } catch (error) {
        console.log(error);
        throw error;
    }
};

export async function insertBulkHsn(models, dataSet, transaction) {
    try {
        const hsn = dataSet?.filter(Boolean).map(data =>
            ({ hsn_code: data.hsn, default_gst_rate: data.rate })
        );

        await models.HSN.bulkCreate(hsn, {
            transaction,
            ignoreDuplicates: true
        });

    } catch (error) {
        console.log(error);
        throw error;
    }
};