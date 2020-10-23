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

const app=express();

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

app.get('/',function(req,res){
    res.render('contact');
    //res.render('cts');
});

app.post('/', async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const hashedVoterId = await bcrypt.hash(req.body.VoterID, 10);
      users.push({
        id: Date.now().toString(),
        name: req.body.firstname,
        email: req.body.email,
        VoterID: hashedVoterId,
        password: hashedPassword
      });
      res.redirect('/login')
    } catch {
      res.redirect('/')
    }
    console.log(users);
  });



app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
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
    successRedirect: '/vote',
    failureRedirect: '/login',
    failureFlash: true
  }));

var email;

/*var otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);
console.log(otp);*/

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
    

app.get('/vote', function(req,res){
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




var otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);
console.log(otp);

app.post('/enter-otp-to-vote', function(req,res){
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
  
        res.render('otp-to-vote',{msg : ''});
    });
});
/*app.get('/verify', function(req,res){
    res.render('votes');
});*/
app.post('/vote-now', function(req,res){
    //res.render('vote-now');
    if(req.body.otp==otp){
        //res.send("You has been successfully registered");
        res.render('vote-now');
    }
    else{
        res.render('otp-to-vote',{msg : 'otp is incorrect'});
    }
});

app.post('/thank-you', function(req,res){
    res.render('thank-you');
});


app.post('/resend',function(req,res){
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

});

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


const PORT=process.env.PORT||5000;
app.listen(PORT,()=>{
    console.log(`app is live at ${PORT}`);
})





