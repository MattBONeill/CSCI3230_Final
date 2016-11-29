var express = require('express');
var session = require('express-session');
var bodyParser = require("body-parser");
var uuid = require('node-uuid');
var app = express();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var fileUpload = require('express-fileupload');

//build the parser of body arguments
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//set standard port to 3000 or the port in the arguments
app.set('port', process.env.PORT || 3000)

//Static folder for js css and images
app.use(express.static('public'));

// able to get the Pug files
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.use(fileUpload());

var sessionMiddleware = session({
    genid: function(request) {
        return uuid.v4();
    },
    resave: false,
    saveUninitialized: false,
    secret: 'profit contributor competitor equality'
});
app.use(sessionMiddleware);

/***Database Schema***/

mongoose.connect('localhost:27018/Frendur_Database');
var Schema = mongoose.Schema;

var userTable = new Schema({
    username: {type: String, 
              unique: true,
              index: true},
    email: String,
    fname: String, 
    lname: String,
    hashedPassword: String
}, {collection: 'users'});//note: auto creates id, boo ya
var Users = mongoose.model('users', userTable);

var postTable = new Schema({
    userID: String,
    text: String,
    timeSent: Number
}, {collection: 'posts'});//note: auto creates id, boo ya
var Posts = mongoose.model('posts', postTable);

var FriendsTable = new Schema({
    userID: String,
    friendID: String
}, {collection: 'friends'});//note: auto creates id, boo ya
var Friends = mongoose.model('friends', FriendsTable);

var MessagesTable = new Schema({
    userID: String,
    friendID: String,
    text: String,
    timeSent: Number
}, {collection: 'messages'});//note: auto creates id, boo ya
var Messages = mongoose.model('messages', MessagesTable);

var CommentsTable = new Schema({
    commentID: String,
    userID: String,
    text :String,
    timeSent: Number
}, {collection: 'comments'});//note: auto creates id, boo ya
var Comments = mongoose.model('comments', CommentsTable);

function cleanDB()
{
    Users.remove({}, function(err) { 
        console.log('collection removed') 
    });
    Posts.remove({}, function(err) { 
        console.log('collection removed') 
    });
    Friends.remove({}, function(err) { 
        console.log('collection removed') 
    });
    Messages.remove({}, function(err) { 
        console.log('collection removed') 
    });
    Comments.remove({}, function(err) { 
        console.log('collection removed') 
    });
}


app.get('/', function(request, response){
    if(isLoggedIn(request.session))
        response.redirect('/Home')
    else
        renderPage(request.session, response, "Main", "Main Page");
});

app.get('/Home', function(request, response){
    if(!isLoggedIn(request.session))
        response.redirect('/')
    else
        renderPage(request.session, response, "Home", "Home Page");
});

app.post('/Posts', function(request, response){
    if(!isLoggedIn(request.session))
        response.redirect('/')
    else{
        var query = request.query;
        if(Object.keys(query).length < 1)
        {
            //find all friends for user
            Friends.find({userID: request.session.username}).select({friendID: 1}).exec(function(error, results){
                if(error || results.length < 0){
                    response.send({});
                    return;
                }
                //create an or statment in mongodb for all possible friend posts
                var friends_or = [];
                results.forEach(function(row){
                    friends_or.push({userID: row.friendID});
                });
                //add current user id as well
                friends_or.push({userID: request.session.username});

                //get the last 50 post for table, sort by time 
                Posts.find({$or: friends_or}).sort({timeSent:1}).limit(50).exec(function(error, results){
                    if(error || results.length < 0){
                        response.send({});
                        return;
                    }
                    //create an or statment for mongod to get all comments for each post
                    var comment_or = [];
                    results.forEach(function(row){
                        comment_or.push({commentID: row._id});
                    });

                    //find all availble comments for each post
                    Comments.find({$or: comment_or}).exec(function(error, comment_results){
                        if(error || comment_results.length < 0){
                            response.send({comments: {}, posts: results});
                            return;
                        }   
                        //create and object that is sorted into slots for each comment
                        var dic_comment = {};
                        comment_results.forEach(function(row){
                            if(!dic_comment[row.commentID])
                                dic_comment[row.commentID] = [];
                            dic_comment[row.commentID].push(row);
                        });
                        //send response to user
                        response.send({comments: dic_comment, posts: results});
                    });
                });
            });
        }
        else
        {
            var user = query.username;
            //get the last 50 post for table, sort by time 
            Posts.find({userID: user}).sort({timeSent:1}).limit(50).exec(function(error, results){
                if(error || results.length < 0){
                    response.send({});
                    return;
                }

                //create an or statment for mongod to get all comments for each post
                var comment_or = [];
                results.forEach(function(row){
                    comment_or.push({commentID: row._id});
                });

                //find all availble comments for each post
                Comments.find({$or: comment_or}).exec(function(error, comment_results){
                    if(error || comment_results.length < 0){
                        response.send({comments: {}, posts: results});
                        return;
                    }   
                    //create and object that is sorted into slots for each comment
                    var dic_comment = {};
                    comment_results.forEach(function(row){
                        if(!dic_comment[row.commentID])
                            dic_comment[row.commentID] = [];
                        dic_comment[row.commentID].push(row);
                    });
                    //send response to user
                    response.send({comments: dic_comment, posts: results});
                });
            });
        }
    }
});

app.post('/Posts/Submit', function(request, response){
    if(!isLoggedIn(request.session))
        response.redirect('/')
    else{
        saveNewResponse(Posts, {userID: request.session.username, text: request.body.text , timeSent: request.body.timeSent});        
        response.send('');
    }
});

app.post('/Posts/Comment', function(request, response){
    if(!isLoggedIn(request.session))
        response.redirect('/')
    else{
        var body = request.body;
        saveNewResponse(Comments,{commentID: body.postID, userID: request.session.username, text: body.text, timeSent: body.timeSent});
        response.send('');
    }
});

app.get('/Profile', function(request, response){
    if(!isLoggedIn(request.session))
        response.redirect('/')
    else{
        var query = request.query;
        if(Object.keys(query).length < 1 || query.username === request.session.username)
        {
            renderPage(request.session, response, "Profile", "Profile Page - " + request.session.username,  {isYours: true, isFriend: true});
        }
        else{
            Friends.find({userID: request.session.username, friendID: query.username}).limit(1).exec(function(error, results){
                if(error || results.length < 1)
                    renderPage(request.session, response, "Profile", "Profile Page - " + query.username, {username: query.username, isFriend: false});
                else
                    renderPage(request.session, response, "Profile", "Profile Page - " + query.username, {username: query.username, isFriend: true});
            });            
        }
    }
});

app.get('/Messages', function(request, response){
    if(!isLoggedIn(request.session))
        response.redirect('/')
    else
        renderPage(request.session, response, "Messages", "Messages");
});

app.post('/Messages/Send', function(request, response){
    if(!isLoggedIn(request.session))
        response.redirect('/')
    else{
        saveNewResponse(Messages, {userID: request.session.username, friendID: request.body.username, text: request.body.text, timeSent: request.body.timeSent});
        response.send('');
    }
});

app.post('/Messages', function(request, response){
    if(!isLoggedIn(request.session))
        response.redirect('/')
    else{
        var query = request.query;
        if(Object.keys(query).length < 1)
        {
            Friends.find({userID: request.session.username}).select({friendID: 1}).exec(function(error, results){
                var friends = [];
                results.forEach(function(row){
                    friends.push(row.friendID);
                });
                response.send(friends);
            });
        }
        else
        {
            if(query.username)
            {
                Messages.
                find({userID: request.session.username, friendID: query.username}).
                sort({timeSent:1}).select({text: 1, timeSent: 1}).exec(function(error, my_results){
                    if(error)
                    {
                        response.send({});
                        console.log('my',error);
                        return;
                    }

                    Messages.
                    find({userID: query.username, friendID: request.session.username}).
                    sort({timeSent:1}).select({text: 1, timeSent: 1}).exec(function(error, their_results){
                        if(error || (their_results.length <  1 && my_results.length < 1))
                        {
                            response.send([]);
                            // console.log('their',error,  my_results, their_results);
                            return;
                        }

                        var messages = [];
                        
                        var m_cnt = 0, t_cnt = 0;
                        while(m_cnt < my_results.length || t_cnt < their_results.length)
                        {
                            if(m_cnt >= my_results.length)
                            {
                                for(; t_cnt < their_results.length; t_cnt++)
                                    messages.push({user: query.username, text: their_results[t_cnt].text, timeSent: their_results[t_cnt].timeSent, isUser: false});
                                break;
                            }
                            if(t_cnt >= their_results.length)
                            {
                                for(; m_cnt < my_results.length; m_cnt++)
                                    messages.push({user: request.session.username, text: my_results[m_cnt].text, timeSent: my_results[m_cnt].timeSent, isUser: true});
                                break;
                            }

                            var their = their_results[t_cnt];
                            var my = my_results[m_cnt];
                            if(Number(their.timeSent) < Number(my.timeSent))
                            {
                                messages.push({user: query.username, text: their.text, timeSent: their.timeSent, isUser: false });
                                t_cnt++
                            }
                            else
                            {
                                messages.push({user: request.session.username, text: my.text, timeSent: my.timeSent, isUser: true }); 
                                m_cnt++  
                            }

                        }

                        response.send(messages);
                    });
                });
            }
        }
    }
});

app.get('/UploadProfilePicture', function(request, response){
    if(!isLoggedIn(request.session))
        response.redirect('/')
    else
        renderPage(request.session, response, "UploadImage", "Upload Your Profile Picture");
});

app.post('/UploadProfilePicture', function(request, response){
    if(!isLoggedIn(request.session))
        response.redirect('/')
    else{
        if(!request.files){
            //error no files
            return;
        }

        file = request.files.fileToUpload;
        
        if(file.name !== ''){
            var dir =  __dirname + '\\public\\uploads\\'
            file.mv(dir + request.session.username +"_profile.png", function(error){
                 if(error)
                {
                    //output error
                    console.log(error);
                    return;
                }
                response.redirect('/Profile');
            });
        }
    }
});

app.get('/Profile/my_image', function(request, response){
    if(!isLoggedIn(request.session))
        response.redirect('/')
    else{
        var dir =  __dirname + '\\public\\uploads\\' + request.session.username +"_profile.png";
        response.sendFile(dir);
    }
});

app.get('/Profile/image', function(request, response){
    if(!isLoggedIn(request.session))
        response.redirect('/')
    else{
        var username = request.query.username;
        var dir =  __dirname + '\\public\\uploads\\' + username +"_profile.png";
        response.sendFile(dir);
    }
});

app.post('/Profile/Friends', function(request, response){
    if(!isLoggedIn(request.session))
        response.redirect('/')
    else{
        var query = request.query;
        var user = request.session.username;
        if(Object.keys(query).length > 0)
        {
            user = query.username;
        }
        Friends.find({userID: user}).select({friendID: 1}).exec(function(error, results){
            if(error || results.length < 1)
            {
                response.send([]);
                return
            }
            var friends = [];
            results.forEach(function(row){
                friends.push(row.friendID);
            });
            response.send(friends);
        });
    }
});

app.post('/Profile/Friends/Add', function(request, response){
    if(!isLoggedIn(request.session))
        response.redirect('/')
    else{
        searchDBForResponse(Friends, { userID: request.session.username, friendID: request.body.username}, { userID: request.session.username, friendID: request.query.username});
        response.send('');
    }
});

app.get('/SignOut', function(request, response){
    request.session.username = null;
    response.redirect('/')  
});

app.get('/SignIn', function(request, response){
    if(isLoggedIn(request.session))
        response.redirect('/Home')
    else
        renderPage(request.session, response, "SignIn", "Sign In");
});

app.post('/SignIn', function(request, response){

    var session = request.session;
    var useremail = request.body.useremail;
    var password = request.body.password;
    var searchQuery = {};

    //check if email
    var regex = /[A-Za-z][\w]+@[A-Za-z]+\.[A-Za-z]+/
    if(useremail.match(regex)){
        searchQuery.email = useremail;
    }
    else{
        searchQuery.username = useremail;
    }
   
    Users.find(searchQuery).limit(1).exec(function(error, results){
        if(error || results.length < 1)
        {
            SignInError(error, response)
            return;
        }
        else
        {
            if(bcrypt.compareSync(password, results[0].hashedPassword)){
                SuccessfulLogin(session, response, results[0].username);
            }
            else
            {
                SignInError("Bad Password", response);
            }
        }
    });
});

app.post('/SignUp', function(request, response){
    var session = request.session;
    var username = request.body.username;
    var password = request.body.password;
    var fname= request.body.fname;
    var lname = request.body.lname;
    var email = request.body.email;

    //check email
    var regex = /[A-Za-z][\w]+@[A-Za-z]+\.[A-Za-z]+/
    if(!email.match(regex)){
        SignupError("Email not Correct", response)
        return;
    }

    Users.find({ username: username }).limit(1).exec(function(error, results){
        if(error || results.length > 0)
        {
            SignupError(error, response)
            return;
        }
        else
        {
            var hash = bcrypt.hashSync(password);
            var data = {
                username: username,
                email: email,
                fname: fname,
                lname: lname,
                hashedPassword: hash
            };

            var newuser = new Users(data);
            newuser.save(function(error){
                if(error)
                {
                    SignupError(error, response)
                    return;
                }
                else
                {
                    var default_image =  __dirname + '\\public\\uploads\\frendur_default.png';
                    var profile_image =  __dirname + '\\public\\uploads\\' + username + "_profile.png"
                    fs.createReadStream(default_image).pipe(fs.createWriteStream(profile_image));
                    SuccessfulLogin(session, response, username);
                }
            });
        }
    });
});

function SuccessfulLogin(session, response, username)
{
    session.username = username;
    response.redirect('/Home')
}

function SignInError(error, response)
{
    AnyError(error, response, "SignIn", '/SignIn');
}

function AnyError(error, response, name, redir)
{
    console.log(name, error);
    response.redirect(redir);
}

function SignupError(error, response)
{
    AnyError(error, response, "SignUp", '/');
}


function isLoggedIn(session)
{
    if(session.username)
        return true;
    else
        return false;
}


function renderPage(session, response, page, title, params)
{
    //if params is empty then make it an empty object,
    var addParams = params || {};
    //set up the default parameters for the render function
    var pageParams = {title:title, loggedin: (session.username)?true:false, username: session.username};

    //for each object in the params object add that object to the parameters of the render function
    Object.keys(addParams).forEach(function(item){
        pageParams[item] = params[item];
    });

    //render the page with its parameters
    response.render(page, pageParams);  
}

function searchDBForResponse(DB, searchQuery, newResponse)
{
    DB.find(searchQuery).limit(1).exec(function(error, results){
        if(results.length > 0)
        {
            DB.update(searchQuery, newResponse, {multi: false}, function(error, numAffected){
                if(error)
                {
                    console.log();
                }
            });
        }
        else
        {
            saveNewResponse(DB, newResponse);
        }
    });
}

function saveNewResponse(DB, value)
{
    
    new DB(value).save(function(error){
        if(error){ 
            console.log("Error adding Default response for user: " + session.sid + ", lecture: " + lecture + ", value: " + JSON.stringify(value) + ", Error: " + error);
        }
    });
}

cleanDB();

//set up users
saveNewResponse(Users, { username: "Sumnut", email: "Matthew@Oneill.com", fname: "Matthew", lname : "ONeill", hashedPassword: bcrypt.hashSync("temp")});
saveNewResponse(Users, { username: "Sumnut2", email: "Matthew@Oneill.com", fname: "Matthew", lname : "ONeill", hashedPassword: bcrypt.hashSync("temp")});
saveNewResponse(Users, { username: "Sumnut3", email: "Matthew@Oneill.com", fname: "Matthew", lname : "ONeill", hashedPassword: bcrypt.hashSync("temp")});
saveNewResponse(Users, { username: "Sumnut4", email: "Matthew@Oneill.com", fname: "Matthew", lname : "ONeill", hashedPassword: bcrypt.hashSync("temp")});
saveNewResponse(Users, { username: "Sumnut5", email: "Matthew@Oneill.com", fname: "Matthew", lname : "ONeill", hashedPassword: bcrypt.hashSync("temp")});
saveNewResponse(Users, { username: "Sumnut6", email: "Matthew@Oneill.com", fname: "Matthew", lname : "ONeill", hashedPassword: bcrypt.hashSync("temp")});
saveNewResponse(Users, { username: "Sumnut7", email: "Matthew@Oneill.com", fname: "Matthew", lname : "ONeill", hashedPassword: bcrypt.hashSync("temp")});
saveNewResponse(Users, { username: "Sumnut8", email: "Matthew@Oneill.com", fname: "Matthew", lname : "ONeill", hashedPassword: bcrypt.hashSync("temp")});
saveNewResponse(Users, { username: "Sumnut9", email: "Matthew@Oneill.com", fname: "Matthew", lname : "ONeill", hashedPassword: bcrypt.hashSync("temp")});
saveNewResponse(Users, { username: "Sumnut10", email: "Matthew@Oneill.com", fname: "Matthew", lname : "ONeill", hashedPassword: bcrypt.hashSync("temp")});

//set up friends
saveNewResponse(Friends, { userID: "Sumnut", friendID: "Sumnut2"});
saveNewResponse(Friends, { userID: "Sumnut2", friendID: "Sumnut"});

saveNewResponse(Friends, { userID: "Sumnut", friendID: "Sumnut3"});
saveNewResponse(Friends, { userID: "Sumnut3", friendID: "Sumnut"});

saveNewResponse(Friends, { userID: "Sumnut", friendID: "Sumnut4"});
saveNewResponse(Friends, { userID: "Sumnut4", friendID: "Sumnut"});

saveNewResponse(Friends, { userID: "Sumnut", friendID: "Sumnut5"});
saveNewResponse(Friends, { userID: "Sumnut5", friendID: "Sumnut"});

saveNewResponse(Friends, { userID: "Sumnut2", friendID: "Sumnut3"});
saveNewResponse(Friends, { userID: "Sumnut3", friendID: "Sumnut2"});

saveNewResponse(Friends, { userID: "Sumnut2", friendID: "Sumnut4"});
saveNewResponse(Friends, { userID: "Sumnut4", friendID: "Sumnut2"});

saveNewResponse(Friends, { userID: "Sumnut4", friendID: "Sumnut4"});
saveNewResponse(Friends, { userID: "Sumnut5", friendID: "Sumnut5"});

saveNewResponse(Friends, { userID: "Sumnut4", friendID: "Sumnut6"});
saveNewResponse(Friends, { userID: "Sumnut6", friendID: "Sumnut4"});

saveNewResponse(Friends, { userID: "Sumnut6", friendID: "Sumnut7"});
saveNewResponse(Friends, { userID: "Sumnut7", friendID: "Sumnut6"});

saveNewResponse(Friends, { userID: "Sumnut6", friendID: "Sumnut8"});
saveNewResponse(Friends, { userID: "Sumnut8", friendID: "Sumnut6"});

saveNewResponse(Friends, { userID: "Sumnut10", friendID: "Sumnut9"});
saveNewResponse(Friends, { userID: "Sumnut9", friendID: "Sumnut10"});

saveNewResponse(Friends, { userID: "Sumnut", friendID: "Sumnut9"});
saveNewResponse(Friends, { userID: "Sumnut9", friendID: "Sumnut"});


saveNewResponse(Messages, { userID: "Sumnut", friendID: "Sumnut2", text: "Hi", timeSent: 10000000});
saveNewResponse(Messages, { userID: "Sumnut2", friendID: "Sumnut", text: "Hey", timeSent: 10000001});
saveNewResponse(Messages, { userID: "Sumnut", friendID: "Sumnut2", text: "How's it going", timeSent: 10000002});

saveNewResponse(Messages, { userID: "Sumnut", friendID: "Sumnut3", text: "Yo", timeSent: 10000000});
saveNewResponse(Messages, { userID: "Sumnut3", friendID: "Sumnut", text: "What up?", timeSent: 10000001});
saveNewResponse(Messages, { userID: "Sumnut", friendID: "Sumnut3", text: "not Much You?", timeSent: 10000002});


saveNewResponse(Messages, { userID: "Sumnut", friendID: "Sumnut10", text: "Dude", timeSent: 10000000});
saveNewResponse(Messages, { userID: "Sumnut10", friendID: "Sumnut", text: "What?", timeSent: 10000001});
saveNewResponse(Messages, { userID: "Sumnut", friendID: "Sumnut10", text: "DUDE!!!!", timeSent: 10000002});


saveNewResponse(Posts, {userID: "Sumnut", text: "She was a fast machine", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut2", text: "She kept her motor clean", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut3", text: "She was the best damn woman I had ever seen", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut4", text: "She had the sightless eyes", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut5", text: "Telling me no lies", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut6", text: "Knockin' me out with those American thighs", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut7", text: "Taking more than her share", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut8", text: "Had me fighting for air", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut9", text: "She told me to come but I was already there", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut10", text: "'Cause the walls start shaking", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut", text: "The earth was quaking", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut2", text: "My mind was aching", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut3", text: "And we were making it and you", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut4", text: "Shook me all night long", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut5", text: "Yeah you shook me all night long", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut6", text: "Working double time", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut7", text: "On the seduction line", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut8", text: "She was one of a kind, she's just mine all mine", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut9", text: "Wanted no applause", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut10", text: "Just another course", timeSent: Number(new Date().getTime())});

setTimeout(function() {
    Posts.find({userID: "Sumnut"}).then(function(results){
        saveNewResponse(Comments,{commentID: results[0]._id, userID:"Sumnut2", text:"Made a meal out of me and came back for more", timeSent: Number(new Date().getTime())});
        saveNewResponse(Comments,{commentID: results[1]._id, userID:"Sumnut3", text:"Had to cool me down", timeSent: Number(new Date().getTime())});
    });
    Posts.find({userID: "Sumnut2"}).then(function(results){
        saveNewResponse(Comments,{commentID: results[0]._id, userID:"Sumnut3", text:"To take another round", timeSent: Number(new Date().getTime())});
        saveNewResponse(Comments,{commentID: results[1]._id, userID:"Sumnut4", text:"Now I'm back in the ring to take another swing", timeSent: Number(new Date().getTime())});
    });
    Posts.find({userID: "Sumnut3"}).then(function(results){
        saveNewResponse(Comments,{commentID: results[0]._id, userID:"Sumnut4", text:"'Cause the walls were shaking", timeSent: Number(new Date().getTime())});
        saveNewResponse(Comments,{commentID: results[1]._id, userID:"Sumnut5", text:"The earth was quaking", timeSent: Number(new Date().getTime())});
    });
}, 100);
//Note: I used The "You Shook Me All Night Long" Lyrics for the text of the post, i don't claim any right to the song, it is property of AC/DC, Atlantic, and Robert John "Mutt" Lange

//listen for a connection
http.listen(app.get('port'), function(){
    console.log('Server started. Listening at *:' + app.get('port'));
});

