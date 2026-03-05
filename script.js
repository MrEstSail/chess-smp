let board
let game = new Chess()

let currentUser

let stockfish = new Worker(
"https://cdn.jsdelivr.net/npm/stockfish/stockfish.js"
)

let evalHistory=[]
let acplTotal=0
let moveCount=0

function askNickname(){

currentUser = prompt("Enter your nickname")

if(!currentUser || currentUser===""){
askNickname()
return
}

document.getElementById("whiteCapturedTitle").innerText =
currentUser + "'s Captured Pieces"

}

function playMoveSound(){

let s=document.getElementById("moveSound")
s.currentTime=0
s.play()

}

function playCaptureSound(){

let s=document.getElementById("captureSound")
s.currentTime=0
s.play()

}

function playNotifySound(){

let s=document.getElementById("notifySound")
s.currentTime=0
s.play()

}

function onDragStart(source,piece){

if(game.game_over()) return false

}

function onDrop(source,target){

let move = game.move({
from:source,
to:target,
promotion:"q"
})

if(move===null) return "snapback"

if(move.captured){
playCaptureSound()
}else{
playMoveSound()
}

board.position(game.fen())

evaluateMove()

if(openingBook[game.fen()]){
alert("Opening: "+openingBook[game.fen()])
}

setTimeout(makeBotMove,300)

}

function makeBotMove(){

stockfish.postMessage("position fen "+game.fen())
stockfish.postMessage("go depth 12")

stockfish.onmessage=function(e){

if(e.data.startsWith("bestmove")){

let move=e.data.split(" ")[1]

game.move({
from:move.substring(0,2),
to:move.substring(2,4),
promotion:"q"
})

board.position(game.fen())

playMoveSound()

evaluateMove()

}

}

}

function evaluateMove(){

stockfish.postMessage("position fen "+game.fen())
stockfish.postMessage("go depth 10")

stockfish.onmessage=function(e){

if(e.data.includes("score cp")){

let value=parseInt(
e.data.match(/score cp (-?\d+)/)[1]
)

evalHistory.push(value/100)

moveCount++

acplTotal+=Math.abs(value)

drawGraph()

updateStats()

}

}

}

function drawGraph(){

new Chart(document.getElementById("evalChart"),{

type:"line",

data:{
labels:evalHistory.map((_,i)=>i),
datasets:[
{
label:"Evaluation",
data:evalHistory
}
]
}

})

}

function updateStats(){

let acpl=Math.round(acplTotal/moveCount)

let accuracy=Math.max(0,100-acpl/5)

document.getElementById("stats").innerHTML=

"Accuracy: "+accuracy.toFixed(1)+"%<br>"+
"ACPL: "+acpl

}

function chooseBot(){

let level=prompt(
"Choose bot:\n1 = 200 elo\n2 = 1000 elo\n3 = strong"
)

if(level==="1"){
stockfish.postMessage("setoption name Skill Level value 1")
}

if(level==="2"){
stockfish.postMessage("setoption name Skill Level value 10")
}

if(level==="3"){
stockfish.postMessage("setoption name Skill Level value 20")
}

}

function newGame(){

game.reset()

board.start()

evalHistory=[]
acplTotal=0
moveCount=0

playNotifySound()

}

board = Chessboard("board",{

draggable:true,

position:"start",

onDragStart:onDragStart,

onDrop:onDrop

})

askNickname()
