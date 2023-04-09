const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, 
    {
        cors: {
            origin: "*",
        }
    });
var cors = require('cors');
var bodyParser = require('body-parser');

app.use(cors())
app.use(bodyParser.json());
// app.use(app.urlencoded({ extended: false }));

const PORT = 3000;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get("/test", (req, res) => {
    res.status(200).send({
        success: true,
        message: "welcome to the lekeamp mobility",
    });
});

app.get("/getActiveUsers", (req, res) => {
    let activeUsers = []
    for (let [id, socket] of io.of("/").sockets) {
        activeUsers.push({
            sessionId: id,
            userName: socket.userName,
            userId: socket.userId,
            userType: socket.userType,
        });
    }
    res.status(200).send({
        success: true,
        message: "Users retrived successfully.",
        data: activeUsers
    });
});

io.use((socket, next) => {
    try {
        console.log(socket.handshake);
        // const userName = socket.handshake.auth.userName;
        // const userId = socket.handshake.auth.userId;
        // const userType = socket.handshake.auth.userType;
        let data = socket.handshake.headers.data;
        console.log("data--> ", data);
        data = data.split(",");
        
        console.log("data--> ", data);
        const userName = data[0];
        const userId = data[1];
        const userType = data[2];
        console.log(userName)
        if (!userName) {
            return next(new Error("invalid username"));
        }
        if (!userId) {
            return next(new Error("invalid userid"));
        }
        if (!userType) {
            return next(new Error("invalid usertype"));
        }
        socket.userName = userName;
        socket.userId = userId;
        socket.userType = userType;
        next();
    }
    catch(error) {
        console.log("error ", error)
        next();
    }
});

io.on('connection', function (socket) {
    console.log('A user connected');

    socket.on("sendInstructionToStation",  (content)  => {
        let to = socket.id;
        let activeUsers = []
        for (let [id, socket] of io.of("/").sockets) {
            activeUsers.push({
                sessionId: id,
                userName: socket.userName,
                userId: socket.userId,
                userType: socket.userType,
            });
        }
        console.log("Content from Spring boot === ", content)
        let station = activeUsers.filter(data => { return data.userId == content.stationId })[0];
        console.log("Station --> ", station)
        if(station) {
            socket.to(station.sessionId).emit("lock", {
              content,
              from: socket.id,
            });
        }
    });

    socket.on('unlock', function ({content, from}) {
        console.log('Unlock initiated');
    });

    socket.on('disconnect', function () {
        console.log('A user disconnected');
    });
});


http.listen(PORT, function () {
    console.log('listening on *: ' + PORT);
});