const jwt = require("jsonwebtoken");
const JWT_TOKEN = "thisischatapp";
const fecthuser = (req,res,next)=>{
    const token  = req.header("jwtToken");
    if(!token){
        return res.status(404).send("Auth-token not is provided")
    }
    try {
        const data = jwt.verify(token,JWT_TOKEN);
        req.user = data.user;
        next();
    } catch (error) {
        console.error("JWT verification error:", error);
        return res.status(401).json({ error: "Invalid token" });
    }
}

module.exports = fecthuser;