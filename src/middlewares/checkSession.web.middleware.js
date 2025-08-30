const auth_session = (req, res, next) => {
  // console.log("middleware"); // FLAG:
  // console.log(req.session.user); // FLAG:

  try {
    // const user = req?.session?.user || null;

    // if (!user) return res.redirect("/auth/login");

    next();
  } catch (error) {
    console.log("authentication error: ", error);
  }
};

export default auth_session;