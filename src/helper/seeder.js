import { districts, permissions, roles, states, businessNodeTypes } from "../../public/dataset.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dataSeederRoot = asyncHandler(async (models) => {
    try {
        const { State, District, Role, Permission, BusinessNodeType } = models;

        /** seed only empty tables so re-runs stay idempotent */
        if (await State.count() === 0) await State.bulkCreate(states);
        if (await District.count() === 0) await District.bulkCreate(districts);
        if (await Role.count() === 0) await Role.bulkCreate(roles);
        if (await Permission.count() === 0) await Permission.bulkCreate(permissions);
        if (await BusinessNodeType.count() === 0) await BusinessNodeType.bulkCreate(businessNodeTypes);

    } catch (error) {
        console.log("error from seeder file");
        throw error;
    }
})

export const dataSeederTenant = asyncHandler(async (models) => {
    try {
        // const { State, District, Role, Permission, WarehouseType, BusinessNodeType } = models;
        const { Role, Permission, BusinessNodeType } = models;

        // await State.bulkCreate(states);
        // await District.bulkCreate(districts);
        // await WarehouseType.bulkCreate(warehouseTypeMaster);
        
        /** seed only empty tables so re-runs stay idempotent */
        if (await Role.count() === 0) await Role.bulkCreate(roles);
        if (await Permission.count() === 0) await Permission.bulkCreate(permissions);
        if (await BusinessNodeType.count() === 0) await BusinessNodeType.bulkCreate(businessNodeTypes);

    } catch (error) {
        console.log("error from seeder file");
        throw error;
    }
})