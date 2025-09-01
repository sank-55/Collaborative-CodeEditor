import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";

const app = express();
//creating server
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",//can be run from anywhere
  },
});

const rooms = new Map();
//if we get connection from any user then fecth the socket id
io.on("connection", (socket) => {
  console.log("User Connected", socket.id);
    // for checking user is in room or not
  let currentRoom = null;
  let currentUser = null;
//take roomID and userName from client 
  socket.on("join", ({ roomId, userName }) => {
    //checking user if is in room then delete him
    if (currentRoom) {
      socket.leave(currentRoom); // remove the socket id from user
      rooms.get(currentRoom).delete(currentUser);
      //send message which user left room and store it as array
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }

    currentRoom = roomId;
    currentUser = userName;

    socket.join(roomId);
    ////checking if the room is created previously or not
    //if not created a new one
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    //having  previous one add user
    rooms.get(roomId).add(userName);
    //inform other user about the joining
    io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom)));
  });
  //If user change code 
  //fetch roomID(where to change), which code to change form frontend
  socket.on("codeChange", ({ roomId, code }) => {
    //update the code in fetched room ID
    socket.to(roomId).emit("codeUpdate", code);
  });
  // User leaving room 
  socket.on("leaveRoom", () => {
    // currentroom and username delete if no need for now
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));

      socket.leave(currentRoom);
    
      currentRoom = null;
      currentUser = null;
    }
  });
  //// Here room ID is key where under this server updating or changing happens
  // while typing on the room id socket gives the userName
  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });
  // same go when language updates or chanes 
  socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language);
  });
  // when user leave or not connected to the server 
  //not show name while refreshing
  socket.on("disconnect", () => {
    // user not delete from a room
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }
    console.log("user Disconnected");
  });
});

const port = process.env.PORT || 5001;

const __dirname = path.resolve();// creating directory

app.use(express.static(path.join(__dirname, "/Frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "Frontend", "dist", "index.html"));
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});