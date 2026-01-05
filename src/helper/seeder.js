import { districts, permissions, roles, states, warehouseTypeMaster, businessNodeTypes } from "../../public/dataset.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dataSeederRoot = asyncHandler(async (models) => {
    try {
        const { State, District, Role, Permission, WarehouseType, BusinessNodeType } = models;

        await State.bulkCreate(states);
        await District.bulkCreate(districts);
        await Role.bulkCreate(roles);
        await Permission.bulkCreate(permissions);
        await WarehouseType.bulkCreate(warehouseTypeMaster);
        await BusinessNodeType.bulkCreate(businessNodeTypes);

    } catch (error) {
        console.log("error from seeder file");
        throw error        
    }
})

export const dataSeederTenant = asyncHandler(async (models) => {
    try {
        // const { State, District, Role, Permission, WarehouseType, BusinessNodeType } = models;
        const { Role, Permission, BusinessNodeType } = models;

        // await State.bulkCreate(states);
        // await District.bulkCreate(districts);
        // await WarehouseType.bulkCreate(warehouseTypeMaster);
        
        await Role.bulkCreate(roles);
        await Permission.bulkCreate(permissions);
        await BusinessNodeType.bulkCreate(businessNodeTypes);

    } catch (error) {
        console.log("error from seeder file");
        throw error        
    }
})