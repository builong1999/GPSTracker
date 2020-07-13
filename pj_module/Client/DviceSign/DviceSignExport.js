
// app: Server listening request and response to client side
// User: Database
const DBMS = require('../../Config/DBMS')

module.exports = function(app, User, ObjectId){
    app.get('/cli-main/gps-control-add',(req,res)=>{
        res.render('addDevice',{ id: req.user.id })
    })

    app.post('/cli-main/search-device', async(req,res)=>{
        let returnVal  = await User.collection(DBMS.GPSDeviceCollection).findOne({
            _id:ObjectId(req.body.DeviceID),
            DeviceOwnerID:""
        })
        if(returnVal){
            res.send({
                DeviceID:req.body.DeviceID,
                DeviceName:"GPS",
                Devicetype:0,
                Devicestatus:returnVal.DeviceStatus
            })
        }
        else{
            returnVal  = await User.collection(DBMS.NTFDeviceCollection).findOne({
                _id:ObjectId(req.body.DeviceID),
                DeviceOwnerID:""
            })
            if(returnVal){
                res.send({
                    DeviceID:req.body.DeviceID,
                    DeviceName:"LED",
                    Devicetype:1,
                    Devicestatus:returnVal.DeviceStatus
                })
            }
            else{
                res.send(false)
            }
        }
    })


    app.post('/cli-main/add-device', async(req,res)=>{
        console.log("On add device:\n",req.body)
        let returnVal = await User.collection(DBMS.GPSDeviceCollection).updateOne({
            _id:ObjectId(req.body.DeviceID)
        },{
            $set:{
                DeviceOwnerID:req.user.id
            }
        })
        // console.log(returnVal)
        if (returnVal.modifiedCount){
            User.collection(DBMS.ClientDeviceControl).insertOne({
                OwnerId:req.user.id,
                GPSID:req.body.DeviceID,
                GPSName:"Not set",
                InformID:"",
                InformName:"",
                Radius:0,
                Data:[0,0]
            })
            res.send(true)
        }
        else{
            returnVal = await User.collection(DBMS.NTFDeviceCollection).updateOne({
                _id:ObjectId(req.body.DeviceID)
            },{
                $set:{
                    DeviceOwnerID:req.user.id
                }
            })
            if (returnVal.modifiedCount){
                User.collection(DBMS.ClientDeviceControl).insertOne({
                    OwnerId:req.user.id,
                    GPSID:"",
                    GPSName:"",
                    InformID:req.body.DeviceID,
                    InformName:"Not set",
                    Radius:0,
                    Data:[0,0]
                })
                res.send(true)
            }
            else{
                res.send(false)
            }
        }
    })
    app.post('/cli-main/get-all-device', async (req,res)=>{
        console.log("On get devices:\n",req.body)
        let GPSList = await User.collection(DBMS.ClientDeviceControl).find({
            OwnerId:req.user.id
        },{projection:{
            GPSName:1,
            GPSID:1,
            InformID:1,
            InformName:1,
        }}).toArray()
        lst = []
        for (let i = 0; i <GPSList.length; i++){
            if (GPSList[i].GPSID){
                lst.push({
                    DeviceID:GPSList[i].GPSID,
                    DeviceName:GPSList[i].GPSName,
                    Devicetype:0
                })
            }
            if (GPSList[i].InformID){
                lst.push({
                    DeviceID:GPSList[i].InformID,
                    DeviceName:GPSList[i].InformName,
                    Devicetype:1
                })
            }
        }
        res.send(lst)
    })
    app.post('/cli-main/settings-device', async(req,res)=>{
        console.log("On settings devices:\n",req.body)
        let GPSModify = await User.collection(DBMS.ClientDeviceControl).update({
            GPSID:{$in:req.body.List}
        },
        {
            $set:{
                InformID:req.body.Id
            }
        }
        )
        if (GPSModify){
            res.send(true)
        }
        else{
            res.send(false)
        }
    })
}