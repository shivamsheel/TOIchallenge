if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const bodyparser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const MongoDBStore = require('connect-mongodb-session')(session);
//const exphbs=require('express-handlebars');
const bcrypt = require('bcrypt');
const verifyController = require('./controllers/verifyController');
const { body, validationResult, check } = require('express-validator');
const mongoose = require('mongoose');
const {createWorker} = require('tesseract.js');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const MONGODB_URI = 'mongodb+srv://ShivamMessi:messi1234@cluster0.3ntoz.mongodb.net/lostvotes?retryWrites=true&w=majority';

const store = new MongoDBStore({

    uri: MONGODB_URI,
    collection: 'sessions',
});

const User = require('./models/user');
const UploadFile = require('./models/upload');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const multer = require('multer');
const AWS = require('aws-sdk');
const uuid = require('uuid');

const app = express();
let data = {};
let userName;
let RegisId;

let shivamPhotoData = {
  "ageRangeLow": 24,
  "ageRangeHigh": 38,
  "gender": "M",
  "genderConfidence": 97.71,
  "matchConfidence": 97.91
};

let sampleData = {
  "uid": "12345",
  "name": "Shivam",
  "dob": "27-01-1993",
  "dobt": "V",
  "gender": "M",
  "phone": 6360527341,
  "email": "shivam_sheel@yahoo.co.in",
  "street": "12 Maulana Azad Marg",
  "vtc": "New Delhi",
  "subdist": "New Delhi",
  "district": "New Delhi",
  "state": "New delhi",
  "pincode": "110087",
  "vid": "1234"
};


//AWS.config.loadFromPath('./config.json');

// view engine setup
//app.engine('handlebars',exphbs({ extname: "hbs", defaultLayout: false, layoutsDir: "views/ "}));
//app.set('view engine','handlebars');

app.set('view engine', 'ejs');
app.set('views', 'views');

// body parser middleware
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

//static folder
app.use('/public', express.static(path.join(__dirname, 'public')));

/*const initializePassport = require('./passport-config');
initializePassport(passport, email => users.find(user => user.email === email), id => users.find(user => user.id === id));*/

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store:store
  }));
  
  //app.use(csrfProtection); //after you initialize the session
  app.use(flash()); //after session
  
  
  
  app.use((req,res,next) => {
  
      if(!req.session.user) {
          return next();
      }
      User.findById(req.session.user._id)
          .then(user => {
             req.user = user;
             next();
          })
          .catch(err => console.log(err));
  });
  
  app.use((req,res,next) => {
      res.locals.isAuthenticated = req.session.isLoggedIn,
      //res.locals.csrfToken = req.csrfToken() //method provided by the package itself - wich is then stored in csrfToen
      next();
  });

const users = [];
const votes = {
    "BJP": 0,
    "Congress": 0,
    "AAP": 0,
    "NOTA": 0
};
//const voteHash = {};
const optionHash = {};
const partyArray = ["BJP", "Congress", "AAP", "NOTA"];

/*app.get('/', function (req, res) {
    res.render('contact');
    //res.render('cts');
});*/

function isAuth (req,res,next) {

    if(!req.session.isLoggedIn) {
        console.log('no Active sessions found!');
        return res.redirect('/login');
    }
    next();

};

app.get('/support', function (req, res) {
  res.render('chatbot',{ name: sampleData.name });
  //res.render('cts');
  console.log('chatbot');

});

app.get('/', function (req, res) {
    res.render('contact',{error:{}, oldInput:{}});
    //res.render('cts');
    console.log('root file');

});


app.post('/', [
    check('firstname','Invalid User Name').isString(),
    check('AdharNumber','Invalid Aadhar Number').isAlphanumeric().custom((value, {req} ) => {
        /* if( value === 'test@test.com') {
            throw new Error('This email is forbidden!');
        }
        return true; */
        return User.findOne({AdharNumber:value}) //finding if user exists or not - left side is DB value right is user's input
        .then(userDoc => { //userDoc can be named any ways we want
          if(userDoc) {  //if user exists
            return Promise.reject('This Aadhar already exists Sir');
          }
        });
    }),
    check('email','Invalid Email').isEmail().normalizeEmail().custom((value, {req} ) => {
        /* if( value === 'test@test.com') {
            throw new Error('This email is forbidden!');
        }
        return true; */
        return User.findOne({email:value}) //finding if user exists or not - left side is DB value right is user's input
        .then(userDoc => { //userDoc can be named any ways we want
          if(userDoc) {  //if user exists
            return Promise.reject('Email already exists Sir');
          }
        });
    }),
    check('phone','Invalid Phone Number').isMobilePhone().custom((value, {req} ) => {
        /* if( value === 'test@test.com') {
            throw new Error('This email is forbidden!');
        }
        return true; */
        return User.findOne({phoneNum:value}) //finding if user exists or not - left side is DB value right is user's input
        .then(userDoc => { //userDoc can be named any ways we want
          if(userDoc) {  //if user exists
            return Promise.reject('This Number already exists Sir');
          }
        });
    }),
    check('VoterID','Invalid VoterID').isAlphanumeric(),
    check('password','Invalid Password').isLength({min:5, max:15})
] , async (req, res) => {
    const errors = validationResult(req);
    const firstname = req.body.firstname;
    const AdharNumber = req.body.AdharNumber;
    const email = req.body.email;
    const phone = req.body.phone;
    const VoterID = req.body.VoterID;
    const password = req.body.password;
    console.log(errors.mapped());
    if(!errors.isEmpty()){
        return res.status(422).render('contact',
        {
            error:errors.mapped(),
            oldInput: {firstname:firstname, AdharNumber:AdharNumber, email:email,phone:phone,VoterID:VoterID, password:password }
        });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const hashedVoterId = await bcrypt.hash(req.body.VoterID, 10);
    const hashedAdhar =  await bcrypt.hash( AdharNumber, 10);
    
       /*users.push({
        id: Date.now().toString(),
        name: req.body.firstname,
        email: req.body.email,
        VoterID: hashedVoterId,
        password: hashedPassword
      });   // delete after tests - no use. */
      
      const user = new User({
        name: firstname,
        email: email,
        voterID: hashedVoterId,
        AdharNumber:AdharNumber,
        phoneNum: phone,
        password: hashedPassword,
        isAdmin: false,
        hasVoted: false,
        regId: hashedAdhar
        
        });
      user.save()
      .then(result => {
        res.redirect('/login');
        console.log(user);
        RegisId = hashedAdhar;
        console.log(RegisId);
        //console.log(users);
      }).catch(err => {
        console.log(err);
        res.redirect('/');
      });

          client.messages
      .create({
         from: 'whatsapp:+14155238886',
         body: 'Hello ' + sampleData.name + 
         ' The voting has now begun \n' + 
         ' Please keep this QR code handy \n' + 
         ' https://webqr.com/ \n'+
         ' This is your registration id  - Shivam@54321 \n' + 
         ' Please find the details below - \n' +
         ' To connect Aadhar with Voter ID visit - \n' +
         ' https://www.nvsp.in/ \n'+
         ' To find your map visit - \n' + 
         ' http://localhost:3000/voters/details\n' + 
         ' ***** HAPPY VOTING SHIVAM ***** ',
         to: 'whatsapp:+916360527341'
       })
      //.then(message => console.log(message.sid));
      .then(message => console.log(message));  // to be enabled while live testing

});




/*app.use(flash());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));*/

app.get('/login', function (req, res) {
    
    /*res.render('login',
    {
        error:{}, 
        oldInput:{},
        errorMessage:''
    }
    );*/
    res.render('login');

    

});

app.post('/login', function (req, res) {
  console.log(req.body.AdharNumber);
  if (req.body.AdharNumber == sampleData.uid) {
    res.render('biometric',{ name: sampleData.name });
  }
  else {
    res.render('votes', { name: sampleData.name });
  }
});

/*app.post('/login',[
    check('email','Invalid Email').isEmail(),
    check('VoterID','Invalid Voter ID').isAlphanumeric(),
    check('password','Invalid Password').isLength({min:5, max:15})
    
], function(req,res) {

    const errors = validationResult(req);
    const VoterID = req.body.VoterID;
    const email = req.body.email;
    const password = req.body.password;
    console.log(errors.mapped());

    if(!errors.isEmpty()){
        
        return res.status(422).render('login',
        {
            error:errors.mapped(),
            oldInput: {email:email, VoterID:VoterID, password:password },
            errorMessage:''
        });
        
    }
    
    User.findOne({email: email})
    .then(user => {
        if(!user) {
            //req.flash('error','Invalid Email or Password');
            return res.status(422).render('login', 
            {
                error:{},
                oldInput: {email:email, VoterID:VoterID,password:password},
                errorMessage: 'Email Does not Match '
            });
        }
        //const getUserId = user._id;
        //const getUserPassword = user.password;
        bcrypt.compare(password, user.password)
        .then(doMatch => {
            if(doMatch) {

                req.session.isLoggedIn = true;
                req.session.user = user; //will store entire mongoose user model
                userName = user.name; 
                console.log('Timer Loading');
                return req.session.save((err) => {
                    console.log(err);
                    if(!user.isAdmin){
                        res.redirect('/timer');
                    }else {
                        res.redirect('/admin');
                    }
                    
                  });
                
                
            }

            return res.status(422).render('login', 
            {
                error:{},
                oldInput: {email:email,VoterID:VoterID,password:password},
                errorMessage: 'Password Does not Match'
            });

        })
        .catch(err=> {
            console.log(err);
            res.redirect('/login');
        });
    })
    .catch(err=> {
        console.log(err);
    });

    
    /*passport.authenticate('local', {
    successRedirect: '/timer',
    failureRedirect: '/login',
    failureFlash: true
  });*/
//});


/*var email;

var otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);
console.log(otp);

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: 'Gmail',

    auth: {
        user: 'messiahleotest@gmail.com',
        pass: 'sprinklr@shivam123',
    }

});*/

app.post('/timer', function (req, res) {
    res.render('timer');

});

app.get('/vote', function (req, res) {
    data.userId = req.user.id;
    data.voterId = req.user.voterID;
    partyArray.forEach(function (partyName) {
        baseVoterIdParty = data.voterId + "===>" + partyName;
        console.log(baseVoterIdParty);
        optionHash[partyName] = bcrypt.hashSync(baseVoterIdParty, 10);
    });
    console.log("\n\n\n\n***************************************\n\n\n\n");
    console.log("Option Hash => " + JSON.stringify(optionHash));
    console.log("\n\n\n\n***************************************\n\n\n\n");
    res.render('votes', { name: sampleData.name });

    /*client.messages
      .create({
         from: 'whatsapp:+14155238886',
         body: 'Hello ' + userName + ' The voting has now begun',
         to: 'whatsapp:+916360527341'
       })
      //.then(message => console.log(message.sid));
      .then(message => console.log(message)); */ // to be enabled while live testing

});
/*app.post('/send',function(req,res){
    email=req.body.email;

     // send mail with defined transport object
    var mailOptions={
        to: req.body.email,
       subject: "Otp for registration is: ",
       html: "<h3>OTP for account verification is </h3>"  + "<h1 style='font-weight:bold;'>" + otp +"</h1>" // html body
     };
     
     transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  
        res.render('otp',{msg : ''});
    });

});


app.use('/verify',function(req,res){

    if(req.body.otp==otp){
        //res.send("You has been successfully registered");
        //res.render('votes');
        res.render('votes');
    }
    else{
        res.render('otp',{msg : 'otp is incorrect'});
    }
}); */




/*var otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);*/

app.post('/enter-otp-to-vote', function (req, res) {
    email = req.body.email;
    phonenumber = '+91' + sampleData.phone;
    data['phonenumber'] = phonenumber;
    console.log(phonenumber);
    let channel = 'sms'; //defaultChannel
    // send mail with defined transport object
    /*var mailOptions={
        to: req.body.email,
       subject: "Otp for registration is: ",
       html: "<h3>OTP for account verification is </h3>"  + "<h1 style='font-weight:bold;'>" + otp +"</h1>" // html body
     };
 
     
     transporter.sendMail(mailOptions, (error, info) => {
         if (error) {
             return console.log(error);
         }
         console.log('Message sent: %s', info.messageId);   
         console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  
         res.render('otp-to-vote',{msg : ''});
        });*/

    verifyController.getCode(phonenumber, channel)
        .then(resp => {
            console.log(resp.data);
            res.render('otp-to-vote', { msg: '', name: sampleData.name });
        })
        .catch(err => console.log("Error in getting otp", err));
});
/*app.get('/verify', function(req,res){
    res.render('votes');
});*/
app.post('/vote-resend', function (req, res) {
    /*var mailOptions = {
        to: email,
        subject: "Otp for registration is: ",
        html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        res.render('otp-to-vote', { msg: "otp has been sent" });
    });*/
    //email = req.body.email;
    //phonenumber = '+91' + req.body.phone;
    phonenumber = '+91' + sampleData.phone;
    data['phonenumber'] = phonenumber;
    let channel = 'sms'; 
    


    verifyController.getCode(phonenumber, channel)
        .then(resp => {
            console.log(resp.data);
            res.render('otp-to-vote', { msg: 'OTP has been re-sent', name: sampleData.name });
        })
        .catch(err => console.log("Error in getting otp", err));

    //defaultChannel
    // send mail with defined transport object
    /*var mailOptions={
        to: req.body.email,
       subject: "Otp for registration is: ",
       html: "<h3>OTP for account verification is </h3>"  + "<h1 style='font-weight:bold;'>" + otp +"</h1>" // html body
     };
 
     
     transporter.sendMail(mailOptions, (error, info) => {
         if (error) {
             return console.log(error);
         }
         console.log('Message sent: %s', info.messageId);   
         console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  
         res.render('otp-to-vote',{msg : ''});
        });*/


});

app.post('/vote-now', function (req, res) {
    //res.render('vote-now');
    console.log(req.body);
    // if(req.body.otp==otp){
    //     //res.send("You has been successfully registered");
    //     res.render('vote-now');
    // }
    // else{
    //     res.render('otp-to-vote',{msg : 'otp is incorrect'});
    // }
    verifyController.verifyCode(data.phonenumber, req.body.otp)
        .then(resp => {
            console.log(resp);
            if (resp.status === 'approved' && resp.valid) {
                res.render('biometric',{ name: sampleData.name });
            } else {
                res.render('otp-to-vote', { msg: "Please enter correct otp", name: sampleData.name});
            }
        })
        .catch(err => res.render('otp-to-vote', { msg: "No OTP",name: sampleData.name }));
});


/*app.get('/upload-file', function(req, res, next) {

    res.render('upload-file', { title: 'Upload File', success:'' });

    });*/

/*app.post('/uploadfile', function (req, res, next) {

    res.render('upload-file', { title: 'Upload File', success: '' });

});*/

const worker = createWorker({
    logger: m => console.log(m)
});

var storage = multer.diskStorage({
    destination: "./data/votingData/",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({
    storage: storage
}).single('file');

app.get('/upload', function (req, res) {
  data.voterId = sampleData.vid;
  partyArray.forEach(function (partyName) {
      baseVoterIdParty = data.voterId + "===>" + partyName;
      console.log(baseVoterIdParty);
      optionHash[partyName] = bcrypt.hashSync(baseVoterIdParty, 10);
  });
  console.log("\n\n\n\n***************************************\n\n\n\n");
  console.log("Option Hash => " + JSON.stringify(optionHash));
  console.log("\n\n\n\n***************************************\n\n\n\n");
  res.render('upload-file',{ title: 'Upload File', success:'' });

});

app.post('/upload', upload, function (req, res, next) {

    //var success = req.file.filename + "uploaded successfully";
    //res.render('upload-file', { title: 'Upload File', success: success });

    const imageFile = req.file.filename;
      var success = req.file.filename + "uploaded successfully";

      const imageDetails = new UploadFile({
        imagename:imageFile
        //userId: req.user // user saved in session
      });
      imageDetails.save()
      .then(result => {
        res.render('upload-file', { title: 'Upload File', success:success });
      })
      .catch(err => {
          console.log(err);

      });
      
      fs.readFile(`./data/votingData/${req.file.filename}`, (err,data) => {
          if(err){
              return console.log(err);
          }
          (async () => {
            await worker.load();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');

            const { data: {text} } = await worker.recognize(data);
            console.log(text);

            await worker.terminate();

          })();
      });
     

});

app.post('/done', function (req, res, next) {

    res.render('vote-now', { name: sampleData.name, bjp: optionHash["BJP"], cong: optionHash["Congress"], aap: optionHash["AAP"], nota: optionHash["NOTA"] });
});

app.get('/admin', function (req, res) {
    res.render('admin', { data: votes });
});

/*app.post('/resend',function(req,res){
    var mailOptions={
        to: email,
       subject: "Otp for registration is: ",
       html: "<h3>OTP for account verification is </h3>"  + "<h1 style='font-weight:bold;'>" + otp +"</h1>" // html body
     };
     
     transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);   
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        res.render('otp',{msg:"otp has been sent"});
    });

});*/





app.post('/thank-you', async function (req, res) {
    console.log(req.body);
    try {
        votedForParty = Object.keys(optionHash).find(key => optionHash[key] === req.body.radio);
        console.log("Voted For : " + votedForParty);
        votes[votedForParty] += 1;
        console.log(votes);
        //const hashedVote = bcrypt.hashSync(req.body.radio, 10);
        //console.log(hashedVote);
        // votes.push({
        //     id: Date.now().toString(),
        //     vote: hashedVote,
        //     voterID: data.voterId
        // });
        //function call to fetch User based on id
        /*users.forEach(function (user) {
            if (user.id === data.userId) {
                user.voted = true;
            }
        });*/
        res.render('thank-you',{name: sampleData.name});
        console.log(users);
    } catch {
        res.redirect('/login');
    }
});



/*const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`app is live at ${PORT}`);
})*/

mongoose.connect(MONGODB_URI)
.then(result => {
    const PORT=process.env.PORT||5000;
    app.listen(PORT,()=>{
    console.log(`app is live at ${PORT}`);
});
}).catch(err=> {
    console.log(err);
});