const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const fs = require('fs');
const filePath = 'json/futsu_ga_ichiban.json';

app.use("/js", express.static(__dirname + "/js/"));
app.use("/img", express.static(__dirname + "/img/"));

app.use(
    "/io",
    express.static(__dirname + "/node_modules/socket.io/client-dist/")
);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/');
});

app.get('/game', (req, res) => {
    res.sendFile(__dirname + '/views/game/');
});

const root = io.of("/");

root.on('connection', (socket) => {
    console.log('page1');
});

const game = io.of("/game");
const players = {};
let ready = 0;

game.on("connection", (socket) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('ファイルの読み込みエラー:', err);
            return;
        } else {
            const jsonData = JSON.parse(data);
            console.log('page2');
            const playerID = socket.id;
            let x = 32;
            let y = 32;

            players[playerID] = {
                x: x,
                y: y
            };

            socket.emit("assignPlayerIdPos", { pid: playerID, y: y, x: x });

            socket.on("ready", () => {
                ready++;
                console.log(ready);
                game.emit('da', "da");
                if (ready == 2) {
                    game.emit("startGame", jsonData);
                    ready = 0;
                }
            });

            socket.on("playerMove", (data) => {
                players[playerID] = data;
                game.emit("playerUpdate", players);
            });

            socket.on("disconnecting", () => {
                delete players[playerID];
                game.emit("playerUpdate", players);
                game.emit('reload');
            });
        }
    });
});

server.listen(3000, () => {
    console.log("Server started on port 3000");
});