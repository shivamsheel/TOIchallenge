const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const uploadSchema = new Schema({
    imagename: {
        type:String,
        required:true    
    }
    /*userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    
      }*/
});

module.exports = mongoose.model('uploadFile', uploadSchema);