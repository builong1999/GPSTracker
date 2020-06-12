
const DBMS = require('../../config/DBMS.json');
const Hash = require('../AuthSecure/Hash')

var User = null
var ObjectId = null

exports.configureFunction = (user, obj)=>{
    User = user
    ObjectId = obj
}

// Client side function 
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



exports.clientLoginDone = (req,res)=>{
    res.write(`
            <script>
                window.opener.location.replace('/home');
                window.close()
            </script>
            `)
}


exports.LocalStragegyClient = (user, pass, done) => {
    User.collection(DBMS.ClientAuthCollection).findOne({username: user},(err,res)=>{
        if(err) return done(err,null);
        if(!res) return done(null,res);
        if(Hash.Pass(pass)==res.password){
            return done(null,{
                id:res._id,
                typeAccount: true
            });
        }
        else{
            return done(null,false,{message:"Password incorrect"})
        }
    })
}

exports.LocalStragegyAdm = (user, pass, done) => {
    User.collection(DBMS.AdminAuthCollection).findOne({username: user},(err,res)=>{
        if(err) return done(err,null);
        if(!res) return done(null,res);
        if(Hash.Pass(pass)==res.password){
            return done(null,{
                id:res._id,
                typeAccount: false
            });
        }
        else{
            return done(null,false,{message:"Password incorrect"})
        }
    })
}


exports.AuthLocalSignUp = async (req, res, next) => {
    checkData = await User.collection(DBMS.ClientAuthCollection).findOne({ "username": req.body.username })
    if (checkData == null) {
        let id = await User.collection(DBMS.ClientAuthCollection).insertOne({
            username: req.body.username,
            password: Hash.Pass(req.body.password),
            typePosition: true
        })
        id = id.ops[0]._id
        console.log("ID:",id)
        let Dat = new Date()
        let DMY = Dat.getDate() + "/" + parseInt( Dat.getMonth())+1 + "/" + Dat.getFullYear();
        await User.collection(DBMS.ClientInfoCollection).insertOne({
            "_id": ObjectId(id),
            Fname: "Not Update",
            Lname: "",
            Email: req.body.username,
            Contact: "+84000000000",
            Balance: 0,
            DateIn: DMY,
            LastAccess: DMY,
            State: 0,
            Level: {
                NowLevel: 0,
                HisLevel: {
                    Normal: 1,
                    Medium: 0,
                    Premium: 0
                }
            }
        })
        res.send(true)
        console.log("has been sent")
    }
    else {
        res.send(false)
    }
}

exports.deserializeUser = function (user, done) {
    User.collection(DBMS.ClientAuthCollection).findOne({ _id: ObjectId(user.id) }, function (err, res) {
        if (err) console.log(err)
        if (res == null) {
            User.collection(DBMS.AdminAuthCollection).findOne({ _id: ObjectId(user.id) }, function (err, res2) {
                if (err) console.log(err)
                if (res2 == null) {
                    return done(null, false)
                }
                else {
                    return done(null, user);
                }
            })
        }
        else {
            return done(null, user);
        }
    });
}

exports.GoogleStrategy = function (accessToken, refreshToken, profile, done) {
    profile = profile._json;
    if (profile.email_verified) {
        User.collection(DBMS.ClientAuthCollection).findOne({ username: profile.email }, (err, res) => {
            if (err) return done(err, null);
            if (res == null) {
                User.collection(DBMS.ClientAuthCollection).insertOne({ 
                    username: profile.email, 
                    password: Hash.Pass(Hash.Select(profile.sub)),
                    typePosition: true
                }
                    , (err, user) => {
                        if (err) throw err;
                        else {
                            id = user.ops[0]._id
                            GoogleAddNewClient(User, profile, ObjectId(id))
                            return done(null, {
                                id: id,
                                typePosition: true
                            });
                        }
                    }
                )
            }
            else {
                return done(null, {
                    id:res._id,
                    typePosition: true
                }

                );
            }
        })
    }
    else {
        return done(null, false, { message: 'Email is not verify' });
    }
}

function GoogleAddNewClient (User, profile, ObjectId) {
    // console.log(profile)
    let Dat = new Date()
    let DMY = Dat.getDate() + "/" + parseInt( Dat.getMonth())+1 + "/" + Dat.getFullYear();
    User.collection(DBMS.ClientInfoCollection).insertOne({
        "_id": ObjectId,
        Fname: profile.given_name,
        Lname: profile.family_name,
        Email: profile.email,
        Contact:"+840000000000",
        Balance:0,
        DateIn: DMY,
        LastAccess:DMY,
        State:0,
        Level:{
            NowLevel:0,
            HisLevel:{
                Normal:1,
                Medium:0,
                Premium:0
            }
        }
    }, (err) => {
        if (err)
            console.log(err)
    })
}

// Admin side function
// ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

exports.adminLoginFunc = (req, res) => {
    let redirectAdminPage = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
</head>
<body>
    <form style="display:none;" action="/auth/adm-requi-log-local" method="POST">
        <input type="text" value="${req.params.user}" name="username">
        <input type="text" value="${req.params.pass}" name="password">
        <button type="submit" id="buttonForm"></button>
    </form>
    <script>
        document.getElementById('buttonForm').click()
    </script>
</body>
</html>
    `
    res.send(redirectAdminPage)
}