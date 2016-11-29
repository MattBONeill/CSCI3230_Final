var express = require('express');
var session = require('express-session');
var bodyParser = require("body-parser");
var uuid = require('node-uuid');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var fileUpload = require('express-fileupload');
var fs = require('fs');
//has the Instructor set to a random value, use uuid to make the guess of the string harder
//the change is so if the user found a way to change the isInstructor session variable to
//a value that woule register as true in the followin statement, then they would be able to easly
//be able to break in
// if(request.session.isInstructor) // easly breakable if access to session data
//the following is a bit harder, they would have to have access to the server variable data

/**** Databases ****/

//setup server for saving the response data
// mongoose.connect('localhost:27018/Response_System');
// var Schema = mongoose.Schema;

// /**** Yes No Response Question - Response Database ****
// * lecture - the Lecture ID
// * studentid - the UUID that of the student that sent the response
// * tag_title - the title of the YNRQ that was sent
// * section - the section in the lecture that the YNRQ is in
// * response - the value of the response that was sent in (1 - yes,0 - no,-1 - unknown)
// *******************************************************/
// var student_YNRQ_schema = new Schema({
//     lecture: String,
//     studentid: String,
//     tag_title: String,
//     section: String,
//     response: Number
// },{collection: 'yesno_response'});
// var student_YNRQ_DB = mongoose.model('yesno_response', student_YNRQ_schema);

// /**** Lecture ID To Name - Database ****
// * lectureID - the Lecture ID
// * lecture_title - the title of the lecture
// *******************************************************/
// var Lecture_ID_Name_schema = new Schema({
//     lectureID: String,
//     lecture_title: String
// },{collection: 'lecture_id_to_name'});
// var Lecture_ID_Name = mongoose.model('lecture_id_to_name', Lecture_ID_Name_schema);

// *** Multiple Choice Response Question - Response Database ****
// * lecture - the Lecture ID
// * studentid - the UUID that of the student that sent the response
// * multi_title - the title of the MCRQ that was sent
// * response - the value of the response that was sent in (Answer is in the from of a "Q" followed by the number of the question)
// ***************************************************************
// var student_multiple_choice_response_schema = new Schema({
//     lecture: String,
//     studentid: String,
//     multi_title: String,
//     response: String
// },{collection: 'multiple_response'});
// var student_multiple_choice_ResponseDB = mongoose.model('multiple_response', student_multiple_choice_response_schema);

// /**** Multiple Choice Response Question - Question Stats Database ****
// * title - title of the MCRQ
// * lecture - the Lecture ID of the MCRQ
// * status - true, if the answer is open. false, if the answer is closed.
// * answer - The correct answer to the question
// **********************************************************************/
// var multiple_choice_lecture_status_schema = new Schema({
//     title: String,
//     lecture: String,
//     status: Boolean,
//     answer: Number
// },{collection: 'multiple_choice_status'});
// var multiple_choice_lecture_statusDB = mongoose.model('multiple_choice_status', multiple_choice_lecture_status_schema);

// /**** User - Database ****
// * userid - a UUID unique to the the student id
// * sid - the students/instructor ID number
// * hashedPassword - the students password that was Hashed by the bcrypt plugin
// * isInstructor - if the User is an Instructor or not
// **************************/
// var userSchema = new Schema({
//     userid: {type: String, 
//               unique: true,
//               index: true},
//     sid: {type: String,
//         unique: true},
//     hashedPassword: String,
//     isInstructor: Boolean
// }, {collection: 'users'});
// var UserDB = mongoose.model('user', userSchema);

// var student_YNRQ_schema = new Schema({
//     lecture: String,
//     studentid: String,
//     tag_title: String,
//     section: String,
//     response: Number
// },{collection: 'yesno_response'});
// var student_YNRQ_DB = mongoose.model('yesno_response', student_YNRQ_schema);


//be able to parse post data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//set the port to 3000
app.set('port', process.env.PORT || 3000)

//static files for .css and .js files
app.use(express.static('public'));

// able to access the templates
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.use(fileUpload());


//taken from randy's example
var sessionMiddleware = session({
    genid: function(request) {
        return uuid.v4();
    },
    resave: false,             // save only when changed
    saveUninitialized: false,  // save even when no data
    // this is used when signing the session cookie
    // cookie: { secure: true }, // encrypted cookies only
    secret: 'apollo slackware prepositional expectations'
});
function cleanDB()
{
    // Users.remove({}, function(err) { 
    //     console.log('collection removed') 
    // });
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

app.use(sessionMiddleware);

// var uploading = multer({
//   dest: __dirname + '../public/uploads/',
//   limits: {fileSize: 10000000, files:1}
// });


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
            renderPage(request.session, response, "Profile", "Profile Page - " + request.session.username,  {isYours: true});
        }
        else
            renderPage(request.session, response, "Profile", "Profile Page - " + query.username, {username: query.username});
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
                            response.send({});
                            console.log('their',error,  my_results, their_results);
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

function login(session, sid, password, onSuccess, onFail)
{
    console.log('Logging In User');
    //check of there is user with the sid that was submitted
    UserDB.find({sid: sid}).limit(1).exec(function(error, results){
        if(error)
        {
            console.log("Login Error: " + error, "sid: "+sid +" password:"+ password);
            onFail("Unable to process you request");
            return;
        }
        if((results.length > 0) && (bcrypt.compareSync(password, results[0].hashedPassword)))
        {
            console.log('Successfully Logged in User, ' + sid);
            //successful login, contiune with the login
            session.userid = results[0].userid;
            if(results[0].isInstructor === true)
                session.isInstructor = instructorKey;
            else
                session.isInstructor = results[0].isInstructor;
            session.sid = results[0].sid;
            onSuccess();
        }
        else
        {
            //incorect password call the on fall method
            console.log("Login Attempt: " + sid /*+ " Password: " + password*/);
            onFail("Invalid Student ID or Password");
        }
    });
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

//setup teacher controlling slide 
io.on('connection', function(socket){
    // var session = socket.request.session;
});

cleanDB();

searchDBForResponse(Friends, { userID: "Sumnut", friendID: "Sumnut2"}, { userID: "Sumnut", friendID: "Sumnut2"});
searchDBForResponse(Friends, { userID: "Sumnut2", friendID: "Sumnut"}, { userID: "Sumnut2", friendID: "Sumnut"});



saveNewResponse(Messages, { userID: "Sumnut", friendID: "Sumnut2", text: "Temp messages", timeSent: 10000000});
saveNewResponse(Messages, { userID: "Sumnut2", friendID: "Sumnut", text: "Temp messages2", timeSent: 10000001});
saveNewResponse(Messages, { userID: "Sumnut", friendID: "Sumnut2", text: "Temp messages3", timeSent: 10000002});

saveNewResponse(Posts, {userID: "Sumnut2", text: "I feeling awesome3", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut", text: "I feeling awesome2", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut2", text: "I feeling awesome4", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut", text: "I feeling awesome1", timeSent: Number(new Date().getTime())});
saveNewResponse(Posts, {userID: "Sumnut2", text: "I feeling awesome5", timeSent: Number(new Date().getTime())});

setTimeout(function() {
    Posts.find({userID: "Sumnut"}).limit(1).then(function(results){
        saveNewResponse(Comments,{commentID: results[0]._id, userID:"Sumnut2", text:"Well fuck you", timeSent: Number(new Date().getTime())});
    });
}, 100);


// var Posts = mongoose.model('posts', postTable);
//     userID: String,
//     text: String,
//     timeSent: Number

// var Comments = mongoose.model('comments', CommentsTable);
//     commentID: String,
//     userID: String,
//     text :String,
//     timeSent: Number





// saveNewResponse(Users, { username: "Sumnut", email: "Matthew@Oneill.com", fname: "Matthew", lname : "ONeill", hashedPassword: bcrypt.hashSync("stronger")});
// saveNewResponse(Users, { username: "Sumnut2", email: "Matthew@Oneill.com", fname: "Matthew", lname : "ONeill", hashedPassword: bcrypt.hashSync("stronger")});

// username: {type: String, 
//               unique: true,
//               index: true},
//     email: String,
//     fname: String, 
//     lname: String,
//     hashedPassword: String


//listen for a connection
http.listen(app.get('port'), function(){
    console.log('Server started. Listening at *:' + app.get('port'));
});




/*
div(class="frendur_post")
            div(class="post_header")
                div(class="post_head")
                    img(src="/profile/my_image")
                    a(class="post_head_username", href="/Profile?username=Sumnut") Sumnut
                div(class="post_text") This is The first test of a post This is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a postThis is The first test of a post
            div(class="post_comments")
                div(class="frendur_comment")
                    div(class="f_c_image")
                        img(class="frendur_comment_img", src="/profile/my_image")
                    div(class="f_c_text")
                        a(class="comment_username", href="/Profile?username=Sumnut") Sumnut 
                        span This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment This is a Test Comment
*/