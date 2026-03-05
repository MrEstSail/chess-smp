let board;
let game = new Chess();
let currentUser;
let stockfish = new Worker("https://cdn.jsdelivr.net/npm/stockfish/stockfish.js");

let evalHistory = [];
let acplTotal = 0;
let moveCount = 0;

function askNickname() {
  currentUser = prompt("Enter your nickname:");
  if (!currentUser) askNickname();
  document.getElementById("whiteCapturedTitle").innerText =
    currentUser + "'s Captured Pieces";
}

function onDragStart(source, piece) {
  if (game.game_over()) return false;
}

function onDrop(source, target) {
  let move = game.move({
    from: source,
    to: target,
    promotion: "q"
  });

  if (move === null) return "snapback";

  playSound(move);
  evaluateMove();
  board.position(game.fen());

  if (openingBook[game.fen()]) {
    alert("Book Move: " + openingBook[game.fen()]);
  }

  setTimeout(makeBotMove, 300);
}

function playSound(move) {
  if (move.captured)
    document.getElementById("captureSound").play();
  else
    document.getElementById("moveSound").play();
}

function makeBotMove() {
  stockfish.postMessage("position fen " + game.fen());
  stockfish.postMessage("go depth 12");

  stockfish.onmessage = function(e) {
    if (e.data.startsWith("bestmove")) {
      let move = e.data.split(" ")[1];
      game.move({
        from: move.substring(0,2),
        to: move.substring(2,4),
        promotion: "q"
      });
      board.position(game.fen());
      evaluateMove();
    }
  };
}

function evaluateMove() {
  stockfish.postMessage("position fen " + game.fen());
  stockfish.postMessage("go depth 10");

  stockfish.onmessage = function(e) {
    if (e.data.includes("score cp")) {
      let val = parseInt(e.data.match(/score cp (-?\d+)/)[1]);
      evalHistory.push(val/100);
      moveCount++;
      acplTotal += Math.abs(val);
      drawGraph();
      updateStats();
    }
  };
}

function drawGraph() {
  new Chart(document.getElementById("evalChart"), {
    type: "line",
    data: {
      labels: evalHistory.map((_,i)=>i),
      datasets: [{
        data: evalHistory
      }]
    }
  });
}

function updateStats() {
  let acpl = Math.round(acplTotal / moveCount);
  let accuracy = Math.max(0, 100 - acpl/5);

  document.getElementById("stats").innerHTML =
    "Accuracy: " + accuracy.toFixed(1) + "%<br>ACPL: " + acpl;
}

function chooseBot() {
  let level = prompt("Choose bot:\n1 = 200 ELO 🤡\n2 = 1000 ELO 😐\n3 = Strong 😈");
  if (level === "1")
    stockfish.postMessage("setoption name Skill Level value 1");
  if (level === "2")
    stockfish.postMessage("setoption name Skill Level value 10");
  if (level === "3")
    stockfish.postMessage("setoption name Skill Level value 20");
}

function newGame() {
  game.reset();
  board.start();
  evalHistory = [];
  acplTotal = 0;
  moveCount = 0;
}

board = Chessboard("board", {
  draggable: true,
  position: "start",
  onDragStart,
  onDrop
});

askNickname();
