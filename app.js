const express = require("express");
const app = express();
const path = require("path");
const indexRouter = require("./routes/index");

const socketio = require('socket.io');
const http = require('http');
const { log } = require("console");
const server = http.createServer(app);
const io = socketio(server);

let waitingUsers = [];
let room = {};

io.on("connection" , function(socket) {
    socket.on("joinroom", function() {
        if(waitingUsers.length > 0) {
            let partner = waitingUsers.shift();
            const roomname = `${socket.id} - ${partner.id}`;
            socket.join(roomname);
            partner.join(roomname);

            io.to(roomname).emit("joined", roomname);
        } else {
            waitingUsers.push(socket);
        }
    });

    socket.on("message", function(data) {
        socket.broadcast.to(data.room).emit("message", data.msg);
    })

    socket.on("disconnect", function() {
        let idx = waitingUsers.findIndex(waitingUser => {
            waitingUser.id === socket.id;
        })

        waitingUsers.splice(idx, 1);
    });

    socket.on("signalingmsg", function(data) {
        socket.broadcast.to(data.room).emit(data.message);
    });

    socket.on("startvideocall", function(data) {
        socket.broadcast.to(data.room).emit("incomingCall")
    })

    socket.on("acceptcall", function({room}) {
        socket.broadcast.to(room).emit("callaccepted");
    })

    socket.on("rejectcall", function({room}) {
        socket.broadcast.to(room).emit("callrejected");
    })
});

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use("/", indexRouter);

server.listen(3000);