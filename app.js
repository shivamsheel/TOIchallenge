if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }

const express=require('express');
const bodyparser=require('body-parser');
const nodemailer=require('nodemailer');
const path=require('path');
const passport = require('passport');
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
//const exphbs=require('express-handlebars');
const bcrypt=require('bcrypt');
const verifyController = require('./controllers/verifyController');

const multer = require('multer');

const app=express();
let data = {};

// view engine setup
//app.engine('handlebars',exphbs({ extname: "hbs", defaultLayout: false, layoutsDir: "views/ "}));
//app.set('view engine','handlebars');

app.set('view engine','ejs');
app.set('views','views');

// body parser middleware
app.use(bodyparser.urlencoded({extended : false}));
app.use(bodyparser.json());

//static folder
app.use('/public',express.static(path.join(__dirname, 'public')));

const initializePassport = require('./passport-config');
initializePassport(passport, email => users.find(user => user.email === email), id => users.find(user => user.id === id));

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

app.get('/',function(req,res){
    res.render('contact');
    //res.render('cts');
});

app.post('/', async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const hashedVoterId = await bcrypt.hash(req.body.voterID, 10);
      users.push({
        id: Date.now().toString(),
        name: req.body.firstname,
        email: req.body.email,
        voterID: hashedVoterId,
        password: hashedPassword,
        voted: false
      });
      res.redirect('/login')
    } catch {
      res.redirect('/')
    }
    console.log(users);
  });



app.use(flash());
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get('/login', function(req,res){
    res.render('login');

});

app.post('/login',passport.authenticate('local', {
    successRedirect: '/timer',
    failureRedirect: '/login',
    failureFlash: true
  }));

var email;

var otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);
console.log(otp);

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service : 'Gmail',
    
    auth: {
      user: 'messiahleotest@gmail.com',
      pass: 'sprinklr@shivam123',
    }
    
});

app.get('/timer', function(req,res){

    res.render('timer');

});
    

app.get('/vote', function(req,res){
    data.userId = req.user.id;
    data.voterId = req.user.voterID;
    partyArray.forEach( function (partyName) {
        baseVoterIdParty = data.voterId + "===>" + partyName;
        console.log(baseVoterIdParty);
        optionHash[partyName] = bcrypt.hashSync(baseVoterIdParty, 10);
    });
    console.log("\n\n\n\n***************************************\n\n\n\n");
    console.log("Option Hash => " + JSON.stringify(optionHash));
    console.log("\n\n\n\n***************************************\n\n\n\n");
    res.render('votes',{name:req.user.name});

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

app.post('/enter-otp-to-vote', function(req,res){
    email=req.body.email;
    phonenumber = '+91' + req.body.phone;
    data['phonenumber'] = phonenumber;
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
         res.render('otp-to-vote',{msg : ''});
     })
     .catch(err => console.log("Error in getting otp", err));
});
/*app.get('/verify', function(req,res){
    res.render('votes');
});*/
app.post('/vote-now', function(req,res){
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
        if(resp.status === 'approved' && resp.valid) {
            res.render('upload-file')
        } else {
            res.render('otp-to-vote', {msg:"Please enter valid otp"});
        }
    })
    .catch(err=> res.render('otp-to-vote', {msg:"Please enter valid otp"}));
});




/*app.get('/upload-file', function(req, res, next) {

    res.render('upload-file', { title: 'Upload File', success:'' });

    });*/

    app.post('/uploadfile', function(req, res, next) {

        res.render('upload-file', { title: 'Upload File', success:'' });

        });

    var storage = multer.diskStorage({
        destination: "./data/votingData/",
        filename:(req,file,cb) => {
            cb(null,file.fieldname+"_"+Date.now() + path.extname(file.originalname));
        }
    });

    var upload = multer({
        storage:storage
    }).single('file');

    app.post('/upload', upload,function(req, res, next) {

      var success = req.file.filename + "uploaded successfully";
    res.render('upload-file', { title: 'Upload File', success:success });

    });

    app.post('/done', function(req, res, next) {

    res.render('vote-now', {bjp: optionHash["BJP"], cong: optionHash["Congress"], aap: optionHash["AAP"], nota: optionHash["NOTA"]});
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

app.post('/vote-resend',function(req,res){
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
        res.render('otp-to-vote',{msg:"otp has been sent"});
    });

});



app.post('/thank-you', async function(req,res){
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
        users.forEach(function (user) {
            if (user.id === data.userId) {
                user.voted = true;
            }
        });
        res.render('thank-you');
        console.log(users);
    } catch {
        res.redirect('/login');
    }
});

const PORT=process.env.PORT||5000;
app.listen(PORT,()=>{
    console.log(`app is live at ${PORT}`);
})





