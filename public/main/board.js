const $board = document.querySelector('#myBoard'),
  game = new Chess(),
  whiteSquareGrey = '#ff8880',
  blackSquareGrey = '#b56762',
  squareClass = 'square-55d63';
var squareToHighlight = null,
  colorToHighlight = null;

var againstAI = false;

const board = Chessboard('myBoard', {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd,
})

timer = null;
$board.addEventListener("touchmove", e => e.preventDefault());

function makeBestMove(depth = 3) {

}

/* 
 * Plays Computer vs. Computer, starting with a given color.
 */
function compVsComp(color = startColour) {
  if (!checkStatus(color)) {
    timer = setTimeout(function () {
      makeBestMove(game.turn(), depthed);
      compVsComp(color === 'white' ? 'black' : 'white');
    }, 250);
  }
}
function playMove(m) {
  if (!m) return false;
  let move = game.move(m);
  board.position(game.fen());
  globalSum = evaluateBoardNow("b");
  updateAdvantage();
  setOpening();
  if (move) playSound(
    game.in_checkmate() ? "checkmate" :
      game.in_draw() ? "draw" :
        game.in_check() ? "check" :
          (move.flags === "k" || move.flags === "q" || move.flags.includes("p")) ? "castle" :
            ("captured" in move) ? "capture" : "move");
  if (game.turn() === 'b') {
    checkStatus('black');

    // Highlight black move
    forObj($board.querySelectorAll('.' + squareClass), a => a.classList.remove('highlight-white'))
    forObj($board.querySelectorAll('.square-' + move.from), a => a.classList.add('highlight-white'))
    squareToHighlight = move.to
    colorToHighlight = 'white'

    forObj($board.querySelectorAll('.square-' + squareToHighlight), a => a
      .classList.add('highlight-' + colorToHighlight))
  }
  else {
    checkStatus('white');

    // Highlight white move
    forObj($board.querySelectorAll('.' + squareClass), a => a.classList.remove('highlight-black'))
    forObj($board.querySelectorAll('.square-' + move.from), a => a.classList.add('highlight-black'))
    squareToHighlight = move.to
    colorToHighlight = 'black'

    forObj($board.querySelectorAll('.square-' + squareToHighlight), a => a
      .classList.add('highlight-' + colorToHighlight))
  }
  refresh();
  return move;
}
/*x
 * Resets the game to its initial state.
 */
function reset() {
  game.reset(x);
  globalSum = 0;
  forObj($board.querySelectorAll('.' + squareClass), a => a.classList.remove('highlight-white'));
  forObj($board.querySelectorAll('.' + squareClass), a => a.classList.remove('highlight-black'));
  forObj($board.querySelectorAll('.' + squareClass), a => a.classList.remove('highlight-hint'))
  board.position(game.fen());
  document.querySelector('#advantageColor').innerText = 'Neither side';
  document.querySelector('#advantageNumber').innerText = globalSum;

  // Kill the Computer vs. Computer callback
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

var undo_stack = [];

function undo() {
  var move = game.undo();
  undo_stack.push(move);

  board.position(game.fen());
  //checkStatus(game.turn() === "w" ? "white" : "black");
  globalSum = evaluateBoardNow("b");
  updateAdvantage();
  playSound(
    game.in_checkmate() ? "checkmate" :
      game.in_draw() ? "draw" :
        game.in_check() ? "check" :
          (move.flags === "k" || move.flags === "q" || move.flags.charAt(0) === "p") ? "castle" :
            move.captured ? "capture" : "move");
  if (game.turn() === 'b') {
    checkStatus('black');

    // Highlight black move
    forObj($board.querySelectorAll('.' + squareClass), a => a.classList.remove('highlight-white'))
    forObj($board.querySelectorAll('.square-' + move.from), a => a.classList.add('highlight-white'))
    squareToHighlight = move.to
    colorToHighlight = 'white'

    forObj($board.querySelectorAll('.square-' + squareToHighlight), a => a
      .classList.add('highlight-' + colorToHighlight))
  }
  else {
    checkStatus('white');

    // Highlight white move
    forObj($board.querySelectorAll('.' + squareClass), a => a.classList.remove('highlight-black'))
    forObj($board.querySelectorAll('.square-' + move.from), a => a.classList.add('highlight-black'))
    squareToHighlight = move.to
    colorToHighlight = 'black'

    forObj($board.querySelectorAll('.square-' + squareToHighlight), a => a
      .classList.add('highlight-' + colorToHighlight))
  }
  refresh();
  setOpening()
}

function redo() {
  playMove(undo_stack.pop())
}

function showHint() {
  var showHint = document.getElementById("showHint");
  forObj($board.querySelectorAll('.' + squareClass), a => a.classList.remove('highlight-hint'));

  // Show hint (best move for white)
  if (!showHint.checked) {
    var move = getBestMove()[0];
    console.log(move)

    forObj($board.querySelectorAll('.square-' + move.from), a => a.classList.add('highlight-hint'));
    forObj($board.querySelectorAll('.square-' + move.to), a => a.classList.add('highlight-hint'));
  }
}

function checkStatus(color) {
  if (game.in_checkmate()) {
    document.querySelector('#status').innerHTML = (`<b>Checkmate!</b> <b>${capitalize(color)}</b> lost.`);
  }
  else if (game.insufficient_material()) {
    document.querySelector('#status').innerHTML = (`It's a <b>draw!</b> (Insufficient Material)`);
  }
  else if (game.in_threefold_repetition()) {
    document.querySelector('#status').innerHTML = (`It's a <b>draw!</b> (Threefold Repetition)`);
  }
  else if (game.in_stalemate()) {
    document.querySelector('#status').innerHTML = (`It's a <b>draw!</b> (Stalemate)`);
  }
  else if (game.in_draw()) {
    document.querySelector('#status').innerHTML = (`It's a <b>draw!</b> (50-move Rule)`);
  }
  else if (game.in_check()) {
    document.querySelector('#status').innerHTML = (`<b>${capitalize(color)}</b> is in <b>check!</b>`);
    return false;
  }
  else {
    document.querySelector('#status').innerHTML = `${capitalize(color)}'s turn to move.`
    return false;
  }
  return true;
}

function updateAdvantage() {
  let x = (-globalSum + 2000),
    y = Math.round((x / 2000 - 1) * 10000) / 1000;
  if (globalSum > 0) {
    document.querySelector('#advantageColor').innerText = ('Black');
    document.querySelector('#advantageNumber').innerText = (-y);
  }
  else if (globalSum < 0) {
    document.querySelector('#advantageColor').innerText = ('White');
    document.querySelector('#advantageNumber').innerText = (y);
  }
  else {
    document.querySelector('#advantageColor').innerText = ('Neither side');
    document.querySelector('#advantageNumber').innerText = (y);
  }
  if (x < 0) x = 0;
  if (x > 4000) x = 4000;
  document.querySelector('#advantageBar').style.width = (x / 4000 * 100) + "%";
}

function removeGreySquares() {
  forObj(document.querySelectorAll('#myBoard .square-55d63'), a => a.style.background = "");
}

function greySquare(square) {
  var $square = document.querySelector('#myBoard .square-' + square)

  var background = whiteSquareGrey
  if ($square.classList.contains('black-3c85d')) {
    background = blackSquareGrey
  }
  $square.style.background = background
}

function onDragStart(square, piece) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // or if it's not that side's turn
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
    (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }

  var moves = game.moves({
    square: square,
    verbose: true
  })

  // exit if there are no moves available for this square
  if (moves.length === 0) return

  // highlight the square they moused over
  greySquare(square)

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to)
  }
}

function onDrop(source, target) {
  undo_stack = [];
  removeGreySquares();

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  })

  // Illegal move
  if (move === null) return 'snapback'

  playSound(
    game.in_checkmate() ? "checkmate" :
      game.in_draw() ? "draw" :
        game.in_check() ? "check" :
          (move.flags === "k" || move.flags === "q" || move.flags.includes("p")) ? "castle" :
            ("captured" in move) ? "capture" : "move")

  // Highlight latest move
  forObj($board.querySelectorAll('.' + squareClass), a => a.classList.remove('highlight-white'))

  forObj($board.querySelectorAll('.square-' + move.from), a => a.classList.add('highlight-white'))
  squareToHighlight = move.to
  colorToHighlight = 'white'

  forObj($board.querySelectorAll('.square-' + squareToHighlight), a => a
    .classList.add('highlight-' + colorToHighlight))
  /*if (!checkStatus(startColour));
  {
    if (againstAI) {
      setTimeout(function () {
        makeBestMove();
      }, 250);
    }
  }*/
}

function onMouseoverSquare(square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true
  })

  // exit if there are no moves available for this square
  if (moves.length === 0) return

  // highlight the square they moused over
  greySquare(square)

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to)
  }
}

function onMouseoutSquare(square, piece) {
  removeGreySquares()
}

function refresh() {
  startColour = game.turn() === "b" ? "black" : "white";
}

function onSnapEnd() {
  board.position(game.fen())
}

function loadBoard(fen) {
  game.load(fen);
  board.position(fen);
  refresh();
}
let el = document.getElementById("aibt"),
  em = document.getElementById("avbt");
el.addEventListener("click", e => {
  if (timer) {
    el.innerText = "AI vs AI";
    clearTimeout(timer);
    timer = undefined;
  }
  else {
    el.innerText = "Stop";
    compVsComp();
  };
})
em.addEventListener("click", e => {
  againstAI = !againstAI;
  if (againstAI) em.innerText = "Stop";
  else em.innerText = "Against AI";
})
checkStatus("white");
updateAdvantage();