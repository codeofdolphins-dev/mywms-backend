import { districts, permissions, roles, states } from "../../public/dataset.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const dataSeeder = asyncHandler(async (models) => {
    try {
        const { State, District, Role, Permission } = models;

        await State.bulkCreate(states);
        await District.bulkCreate(districts);
        await Role.bulkCreate(roles);
        await Permission.bulkCreate(permissions);

    } catch (error) {
        console.log("error from seeder file");
        throw error        
    }
})

export default dataSeeder;