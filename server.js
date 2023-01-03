//install stuff
const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const createAdapter = require("@socket.io/redis-adapter").createAdapter;
const redis = require("redis");
require("dotenv").config();
const session = require('express-session');
const bodyParser = require('body-parser');
const { hashSync, genSaltSync, compareSync } = require("bcrypt");

const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
  } = require("./utils/users");

 
//create instances
const app=express();
  
const cors=require("cors");

app.use(cors());
  
const redisStore = require('connect-redis')(session);

const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatCord Bot";

(async () => {
  
  await pubClient.connect();
  subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
})();

  
  
//inistial portes
const PORT= process.env.APP_PORT;
const IN_PROD = process.env.NODE_ENV === 'production'
const TWO_HOURS = 1000 * 60 * 60 * 2
 
const REDIS_PORT= process.env.REDIS_PORT;
 
 
//create the redis client
const pubClient = redis.createClient({
    host: 'localhost',
    port: REDIS_PORT
 })
   
  
 // instance of client
const  sessionStore = new redisStore({ client: pubClient });
  
// connection posibility
pubClient.on('error', function (err) {
    console.log('Could not establish a connection with redis. ' + err);
});
pubClient.on('connect', function (err) {
    console.log('Connected to redis successfully');
});
  
  
  
  
app.use(bodyParser.urlencoded({
    extended: true
}));
  
app.use(bodyParser.json())
  
  
app.use(session({
    name: process.env.SESS_NAME,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    secret: process.env.SESS_SECRET,
    cookie: {
        maxAge: TWO_HOURS,
        sameSite: true,
        secure: IN_PROD
    }
}))
  
 //redicet user to login (login err)
const redirectLogin = (req, res, next) =>{
    if(!req.session.email){
        res.redirect('/login')
    }else{
            next()
        }
 }
  
  
  // redicet user to home page (succ login or signe up)
 const redirectHome = (req, res, next) =>{
    if(req.session.email){
        res.redirect('/home')
    }else{
            next()
        }
 }
  
    
  //html form for logout 
app.get('/', (req, res)=>{
    const { email } = req.session
    console.log(email);
    res.send(`
    <h1> Welcome!</h1>
     ${email ? `<a href = '/home'> Home </a>
    <form method='post' action='/logout'>
    <button>Logout</button>
    </form>` : `<a href = '/login'> Login </a>
   <a href = '/register'> Register </a>
`}
    `)
})
 
 // html page for home page
app.get('/home',  redirectLogin, async(req,res)=>{
    const {email} =req.session
    console.log(email);
     if(email){
    try{
        pubClient.hgetall(email, function(err, obj){
      
        console.log(obj)
        //req.user = obj;
        res.send(`
        <h1>Home</h1>
        <a href='/'>Main</a>
        <ul>
        <li> Name: ${obj.username} </li>
        <li> Email:${obj.email} </li>
        </ul>
      
        `)
        })    
    } catch(e) {
        console.log(e);
        res.sendStatus(404);
    }
}
     
})
  
  //html page for login form
app.get('/login',redirectHome, (req,res)=>{
    res.send(`
    <h1>Login</h1>
    <form method='post' action='/login'>
    <input type='email' name='email' placeholder='Email' required />
    <input type='password' name='password' placeholder='password' required/>
    <input type='submit' />
    </form>
    <a href='/register'>Register</a>
    `)
})
 
 
 
 
 
 
 //html page for signe up form
 app.get('/register',redirectHome, (req,res)=>{
    res.send(`
    <h1>Register</h1>
    <form method='post' action='/Register'>
    <input type='text' name='firstName' placeholder='First Name' required />
    <input type='text' name='lastName' placeholder='Last Name' required />
    <input type='text' name='username' placeholder='UserName' required />
    <input type='email' name='email' placeholder='Email' required />
    <input type='password' name='password' placeholder='password' required/>
    <input type='submit' />
    </form>
    <a href='/login'>Login</a>
    `)
})
  
 
 
 // login function + vireficatin
app.post('/login',redirectHome, (req, res, next)=>{
    try{ 
    const email = req.body.email;
    let password = req.body.password;
    pubClient.hgetall(email, function(err, obj){
      
    if(!obj){
        return res.send({
            message: "Invalid email or password"
        })
    }
    console.log(obj);
    const isValidPassword = compareSync(password, obj.password);
    if(isValidPassword){
        console.log(req.session);
        obj.password = undefined;
        console.log(obj);
        req.session.email = obj.email;
        console.log(req.session.email);
         return res.redirect('/home');
    }  else{
         res.send(
             "Invalid email or password"
        );
        return res.redirect('/login')
    }
});
         
    } catch(e){
        console.log(e);
    }
  
 
});
  
 
 
 
 // signe up function
app.post('/register', redirectHome, (req, res, next)=>{
    try{
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const username = req.body.username;
        const email = req.body.email;
        let password = req.body.password;
  
  
              if (!firstName || !lastName || !username || !email || !password) {
                return res.sendStatus(400);
             }
  
             const salt = genSaltSync(10);
             password = hashSync(password, salt);
  
             
 
             pubClient.hmset(email, 
                    'first_name', firstName,
                    'last_name', lastName,
                    'username',username,
                    'email', email,
                    'password', password
                  , function(err, reply){
                if(err){
                  console.log(err);
                  res.redirect('/register') ;
                }
                console.log(reply);
                res.redirect('/login') ;
                 
              });
               
  
        
  
    } catch(e){    
        console.log(e);
        res.sendStatus(400);
    }
});
  
 
 
 //logout function
app.post('/logout', redirectLogin, (req, res)=>{
    req.session.destroy(err => {
        if(err){
            return res.redirect('/home')
        }
        
        res.clearCookie(process.env.SESS_NAME)
        res.redirect('/login')
    })
  
})
  
// Run when client connects
io.on("connection", (socket) => {
    console.log(io.of("/").adapter);
    socket.on("joinRoom", ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
      socket.join(user.room);
  
      // Welcome current user
      socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));
  
      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} has joined the chat`)
        );
  
      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    });
  
    // Listen for chatMessage
    socket.on("chatMessage", (msg) => {
      const user = getCurrentUser(socket.id);
  
      io.to(user.room).emit("message", formatMessage(user.username, msg));
      pubClient.rPush("messagesChat", `${user.username}:${msg} in room : ${user.room}`);
    });
  
    // Runs when client disconnects
    socket.on("disconnect", () => {
      const user = userLeave(socket.id);
  
      if (user) {
        io.to(user.room).emit(
          "message",
          formatMessage(botName, `${user.username} has left the chat`)
        );
  
        // Send users and room info
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      }
    });
  });
  
 
 //port set

app.listen(PORT, ()=>{console.log(`server is listening on ${PORT}`)});