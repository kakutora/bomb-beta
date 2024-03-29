import { keyInput, KeyOutput, keyEvent } from '/js/utils/keyIO.js';
import { realPaint } from '/js/utils/canvasDraw.js';

let players = {};
let pid;

const vObj = {};

const rObj = {};

const key = {
    up: false,
    down: false,
    left: false,
    right: false,
    move: 0
};

let startFlag = 0;

const c = document.querySelector('#canvas');

const img = {//画像パス
    chr: "/img/chr.png"
};

const SMOOTH = 1;//補完処理

let mapImg;//マップチップ画像
let chrImg;//マップチップ画像

let rScreen;//仮想画面
let vScreen;//実画面

let rWidth;//実画面の幅
let rHeight;//実画面の高さ

let defaultMoveSpeed = 32;

//----------------------------------------------------
const socket = io('/game', {
    reconnection: true,  // 再接続を有効にする
    reconnectionAttempts: 3,  // 再接続試行回数の設定
    reconnectionDelay: 1000  // 再接続試行間隔(ms)の設定
}); // Socket.IOのインスタンスを作成

const testStart = () => {
    socket.emit("ready");
    document.querySelector("button").removeEventListener("click", testStart);
};

document.querySelector("button").addEventListener("click", testStart);

socket.on('reload', () => {//片方がリロードした際、全員リロード
    location.reload();
});

socket.on('assignPlayerIdPos', (data) => {
    pid = data.pid;
    console.log(pid);
    createPlayer(data.pid, data.x, data.y);
    startFlag = 1;
});

socket.on("startGame", (data) => {//メイン処理
    if (startFlag == 1) {
        firstProcesses(data);
        mainLoop(data);

        setInterval(() => {//機種によってFPSが異なるため、暫定的な処理
            mainLoop(data);
        }, 60);
    }
    else {
        location.reload();
    }
});

socket.on("playerUpdate", (playerData) => {
    updatePlayers(playerData);
});

const firstProcesses = (map) => {
    const player = players[pid];
    socket.emit("playerMove", player);

    loadImage(map);

    vScreen = document.createElement('canvas');

    rObj.vScreen = vScreen;
    rObj.vScreen.width = (map.TILESIZE * map.MAP_WIDTH);
    rObj.vScreen.height = (map.TILESIZE * map.MAP_HEIGHT);
    rObj.rCtx = c.getContext("2d");

    vObj.map = map;
    vObj.vCtx = vScreen.getContext("2d");
    vObj.mapImg = mapImg;
    vObj.chrImg = chrImg;

    canvasSize(map);
    window.addEventListener("resize", () => { canvasSize(map); });
};

const mainLoop = (map) => {
    realPaint(rObj, vObj, players);
    addEventListener("keydown", (e) => { keyEvent(e, key, true); }, false);
    addEventListener("keyup", (e) => { keyEvent(e, key, false); }, false);
    keyInput(map, players[pid], key);
    KeyOutput(defaultMoveSpeed, players[pid], key, socket);
};

const canvasSize = (map) => {
    c.width = window.innerWidth / 1.15;
    c.height = window.innerHeight / 1.15;

    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = ctx.msImageSmoothingEnabled = SMOOTH;

    rObj.rWidth = c.width;
    rObj.rHeight = c.height;

    if (rObj.rWidth / (map.TILESIZE * map.MAP_WIDTH) < rObj.rHeight / (map.TILESIZE * map.MAP_HEIGHT)) {
        rObj.rHeight = rObj.rWidth * (map.TILESIZE * map.MAP_HEIGHT) / (map.TILESIZE * map.MAP_WIDTH);
    } else {
        rObj.rWidth = rObj.rHeight * (map.TILESIZE * map.MAP_WIDTH) / (map.TILESIZE * map.MAP_HEIGHT);
    }
};

const updatePlayers = (playerData) => {
    players[pid].x = playerData[pid].x;
    players[pid].y = playerData[pid].y;
    for (const id in playerData) {
        if (id in players) {
            players[id].x = playerData[id].x;
            players[id].y = playerData[id].y;
        } else {
            players[id] = playerData[id];
        }
    }
};

const createPlayer = (id, x, y) => {
    players[id] = {
        x: x,
        y: y
    };
};

const loadImage = (map) => {
    mapImg = new Image();
    mapImg.src = map.MAP_IMG_PATH;

    chrImg = new Image();
    chrImg.src = img.chr;
};

