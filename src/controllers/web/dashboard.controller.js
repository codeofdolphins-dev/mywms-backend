import User from "../../models/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import bcrypt from "bcrypt"

// GET request
const dashboard = async(req, res) => {
    return res.render("dashboard");
}



// POST request


export {dashboard}