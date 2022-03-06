import express from "express";
import http from "http";

import { Server } from "socket.io";

const app = express();

const httpServer = http.createServer(app);

const wsServer = new Server(httpServer);

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => {
  res.render("home");
});
httpServer.listen(3000, console.log("Hello !"));
