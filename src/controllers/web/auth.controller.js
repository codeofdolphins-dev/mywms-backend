import User from "../../models/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import bcrypt from "bcrypt"

// GET request
const registerForm = async(req, res) => {
    return res.render("adminRegister");
}

const loginForm = async(req, res) => {
    return res.render("login");
}

const logOut = asyncHandler(async (req, res) => {
    try {
       
        req.session.destroy((err) => {
		console.log(err);
		if(err) return res.json({success: false, code: 500, message: "Error loging out!"});

		res.clearCookie("connect.sid", {
			path: "/",
			httpOnly: true
		});
		// return res.json({success: true, code: 200, message: "logout seccessfully."})

        return res.redirect("/auth/login");
	})

    } catch (error) {
        console.log(error);        
        return res.status(400).json({success: false, code: 400, message: error.message})
    };
});


// POST request
const registerSubmit = asyncHandler(async (req, res) => {
    try {        
        const { email = "", full_name = "", password = "", ph_number = "" } = req.body;

        if([email, full_name, password].some(field => field === "")){
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        }

        const isRegister = await User.findOne({ where: { email } });

        if(isRegister) return res.status(400).json({ success: false, code: 400, message: `User with email: ${email} alrady exists!!!` });

        const hashPassword = await bcrypt.hash(password,  parseInt(process.env.SALTROUNDS, 10));

        const user = await User.create({
            email,
            password: hashPassword,
            full_name,
            f_name: full_name?.split(" ")[0],
            l_name: full_name?.split(" ")[1],
            ph_number
        });

        if(user) return res.status(200).json({ success: true, code: 200, message: "Register Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const loginSubmit = asyncHandler(async (req, res) => {
    try {        
        const { email = "", password = "" } = req.body;

        if(!email || !password) return res.status(400).json({success: false, code: 400, message: "Email and Password are required!"});

        const user = await User.findOne({ where: { email }});

        if(!user) return res.status(400).json({ success: false, code: 400, message: "User Not Found!" });

        const is_password_matched = await bcrypt.compare(password, user.password);

        if(is_password_matched){

            const cleanedUser = user.dataValues;

            delete cleanedUser.password;
            delete cleanedUser.accessToken;

            req.session.user = cleanedUser;            

            return res.status(200).json({ success: true, code: 200, message: "Login Successfully" });
        }
        return res.status(401).json({ success: false, code: 401, message: "Wrong Password!" });

    } catch (error) {
        console.log(error);        
        return res.status(400).json({success: false, code: 400, message: error.message})
    };
});

export {registerForm, loginForm, registerSubmit, loginSubmit, logOut }