import { districts, permissions, roles, states, requisitionLevelMaster, warehouseTypeMaster, reqisitionRole } from "../../public/dataset.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const dataSeeder = asyncHandler(async (models) => {
    try {
        const { State, District, Role, Permission, RequisitionHierarchyMaster, WarehouseType } = models;

        await State.bulkCreate(states);
        await District.bulkCreate(districts);
        await Role.bulkCreate(roles);
        await Role.bulkCreate(reqisitionRole);
        await Permission.bulkCreate(permissions);
        await RequisitionHierarchyMaster.bulkCreate(requisitionLevelMaster);
        await WarehouseType.bulkCreate(warehouseTypeMaster);

    } catch (error) {
        console.log("error from seeder file");
        throw error        
    }
})

export default dataSeeder;