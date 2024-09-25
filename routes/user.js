const {Router}=require("express");
const User=require('../models/user');
const router=Router();

router.get("/signup",(req,res)=>{
    return res.render("signup")
});

router.get("/signin",(req,res)=>{
    return res.render("signin")
});


router.post("/signup",async (req,res)=>{
    const {firstName,lastName,email,password}=req.body;
    await User.create({
        firstName,
        lastName,
        email,
        password,
    });
    
    return res.redirect("/user/signin");
})

router.post("/signin",async (req,res)=>{
    const{email,password}=req.body;
    try{
    const token=await User.matchPassword(email,password);
     return res.cookie("token",token).redirect("/");
    }
    catch(error){
        return res.render("signin",{
            error:"Incorrect Email or Password"
        });
    }
});

router.get('/logout',(req,res)=>{
    res.clearCookie("token").redirect("/");
});

module.exports=router;

 