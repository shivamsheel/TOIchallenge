
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

var userSchema = new Schema({
    name:{
        type: String,
        requiredPaths: true
    },
    email:{
        type:String,
        required:true
    },
    voterID:{
        type:String,
        required:true
    },
    AdharNumber:{
        type:String,
        required:true
    },
    phoneNum: {
        type:String,
        required:true
    },
    password: {
        type:String,
        required:true
    },
    isAdmin: {
        type:Boolean,
        required: true
    },
    hasVoted:{
        type:Boolean,
        required:true
    },
    date:{
        type:Date,
        default:Date.now

    },
    regId:{
        type:String,
        required:true
    }
});

module.exports = mongoose.model('User', userSchema);