const verifyPermission = ( purpose ) => {
    return (req, res, next) => {
        if(!req.user.permissions.includes(purpose)){
            return res.status(403).json({ success: false, message: "Access denied!" });
        }
        next();
    };
};

export { verifyPermission }