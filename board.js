/* 
 * A simple chess AI, by someone who doesn't know how to play chess.
 * Uses the chessboard.js and chess.js libraries.
 * 
 * Copyright (c) 2020 Zhang Zeyu
 */

var STACK_SIZE = 6000; // maximum size of undo stack

var board = null
var $board = $('#myBoard')
var game = new Chess()
var table = {}
var depthed=3;
var pieceValue = {
  p: 1,
  b: 3,
  n: 3,
  r: 5,
  q: 7
}
var globalSum = 0 // always from black's perspective. Negative for white's perspective.
var whiteSquareGrey = '#ff8880'
var blackSquareGrey = '#b56762'
var inf=100000000;

var squareClass = 'square-55d63'
var squareToHighlight = null
var colorToHighlight = null
var positionCount;
var startColour = "white";

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd,
}
board = Chessboard('myBoard', config)

timer = null;

/* 
 * Piece Square Tables, adapted from Sunfish.py:
 * https://github.com/thomasahle/sunfish/blob/master/sunfish.py
 */

var weights = { 'p': 100, 'n': 280, 'b': 320, 'r': 479, 'q': 929, 'k': 60000, 'k_e': 60000 };
var pst_w = {
  'p': [
            [100, 100, 100, 100, 105, 100, 100, 100],
            [78, 83, 86, 73, 102, 82, 85, 90],
            [7, 29, 21, 44, 40, 31, 44, 7],
            [-17, 16, -2, 15, 14, 0, 15, -13],
            [-26, 3, 10, 9, 6, 1, 0, -23],
            [-22, 9, 5, -11, -10, -2, 3, -19],
            [-31, 8, -7, -37, -36, -14, 3, -31],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ],
  'n': [
            [-66, -53, -75, -75, -10, -55, -58, -70],
            [-3, -6, 100, -36, 4, 62, -4, -14],
            [10, 67, 1, 74, 73, 27, 62, -2],
            [24, 24, 45, 37, 33, 41, 25, 17],
            [-1, 5, 31, 21, 22, 35, 2, 0],
            [-18, 10, 13, 22, 18, 15, 11, -14],
            [-23, -15, 2, 0, 2, 0, -23, -20],
            [-74, -23, -26, -24, -19, -35, -22, -69]
        ],
  'b': [
            [-59, -78, -82, -76, -23, -107, -37, -50],
            [-11, 20, 35, -42, -39, 31, 2, -22],
            [-9, 39, -32, 41, 52, -10, 28, -14],
            [25, 17, 20, 34, 26, 25, 15, 10],
            [13, 10, 17, 23, 17, 16, 0, 7],
            [14, 25, 24, 15, 8, 25, 20, 15],
            [19, 20, 11, 6, 7, 6, 20, 16],
            [-7, 2, -15, -12, -14, -15, -10, -10]
        ],
  'r': [
            [35, 29, 33, 4, 37, 33, 56, 50],
            [55, 29, 56, 67, 55, 62, 34, 60],
            [19, 35, 28, 33, 45, 27, 25, 15],
            [0, 5, 16, 13, 18, -4, -9, -6],
            [-28, -35, -16, -21, -13, -29, -46, -30],
            [-42, -28, -42, -25, -25, -35, -26, -46],
            [-53, -38, -31, -26, -29, -43, -44, -53],
            [-30, -24, -18, 5, -2, -18, -31, -32]
        ],
  'q': [
            [6, 1, -8, -104, 69, 24, 88, 26],
            [14, 32, 60, -10, 20, 76, 57, 24],
            [-2, 43, 32, 60, 72, 63, 43, 2],
            [1, -16, 22, 17, 25, 20, -13, -6],
            [-14, -15, -2, -5, -1, -10, -20, -22],
            [-30, -6, -13, -11, -16, -11, -16, -27],
            [-36, -18, 0, -19, -15, -15, -21, -38],
            [-39, -30, -31, -13, -31, -36, -34, -42]
        ],
  'k': [
            [4, 54, 47, -99, -99, 60, 83, -62],
            [-32, 10, 55, 56, 56, 55, 10, 3],
            [-62, 12, -57, 44, -67, 28, 37, -31],
            [-55, 50, 11, -4, -19, 13, 0, -49],
            [-55, -43, -52, -28, -51, -47, -8, -50],
            [-47, -42, -43, -79, -64, -32, -29, -32],
            [-4, 3, -14, -50, -57, -18, 13, 4],
            [17, 30, -3, -14, 6, -1, 40, 18]
        ],

  // Endgame King Table
  'k_e': [
            [-50, -40, -30, -20, -20, -30, -40, -50],
            [-30, -20, -10, 0, 0, -10, -20, -30],
            [-30, -10, 20, 30, 30, 20, -10, -30],
            [-30, -10, 30, 40, 40, 30, -10, -30],
            [-30, -10, 30, 40, 40, 30, -10, -30],
            [-30, -10, 20, 30, 30, 20, -10, -30],
            [-30, -30, 0, 0, 0, 0, -30, -30],
            [-50, -30, -30, -30, -30, -30, -30, -50]
        ]
};
var pst_b = {
  'p': pst_w['p'].slice().reverse(),
  'n': pst_w['n'].slice().reverse(),
  'b': pst_w['b'].slice().reverse(),
  'r': pst_w['r'].slice().reverse(),
  'q': pst_w['q'].slice().reverse(),
  'k': pst_w['k'].slice().reverse(),
  'k_e': pst_w['k_e'].slice().reverse()
}

var pstOpponent = { 'w': pst_b, 'b': pst_w };
var pstSelf = { 'w': pst_w, 'b': pst_b };

function copy(text) {
  var textArea = document.createElement("textarea");
  // Place in the top-left corner of screen regardless of scroll position.
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';

  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = 0;

  // Clean up any borders.
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';

  // Avoid flash of the white box if rendered for any reason.
  textArea.style.background = 'transparent';


  textArea.value = text;

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Copying text command was ' + msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }

  document.body.removeChild(textArea);
}
/* 
 * Evaluates the board at this point in time, 
 * using the material weights and piece square tables.
 */
function evaluateBoard(move, prevSum, color)
{
  var from = [8 - parseInt(move.from[1]), move.from.charCodeAt(0) - 'a'.charCodeAt(0)];
  var to = [8 - parseInt(move.to[1]), move.to.charCodeAt(0) - 'a'.charCodeAt(0)];

  // Change endgame behavior for kings
  if (prevSum < -1500)
  {
    if (move.piece === 'k') { move.piece = 'k_e' }
    else if (move.captured === 'k') { move.captured = 'k_e' }
  }

  if ('captured' in move)
  {
    // Opponent piece was captured (good for us)
    if (move.color === color)
    {
      prevSum += (weights[move.captured] + pstOpponent[move.color][move.captured][to[0]][to[1]]);
    }
    // Our piece was captured (bad for us)
    else
    {
      prevSum -= (weights[move.captured] + pstSelf[move.color][move.captured][to[0]][to[1]]);
    }
  }

  if (move.flags.includes('p'))
  {
    // NOTE: promote to queen for simplicity
    move.promotion = 'q';

    // Our piece was promoted (good for us)
    if (move.color === color)
    {
      prevSum -= (weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]]);
      prevSum += (weights[move.promotion] + pstSelf[move.color][move.promotion][to[0]][to[1]]);
    }
    // Opponent piece was promoted (bad for us)
    else
    {
      prevSum += (weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]]);
      prevSum -= (weights[move.promotion] + pstSelf[move.color][move.promotion][to[0]][to[1]]);
    }
  }
  else
  {
    // The moved piece still exists on the updated board, so we only need to update the position value
    if (move.color !== color)
    {
      prevSum += pstSelf[move.color][move.piece][from[0]][from[1]];
      prevSum -= pstSelf[move.color][move.piece][to[0]][to[1]];
    }
    else
    {
      prevSum -= pstSelf[move.color][move.piece][from[0]][from[1]];
      prevSum += pstSelf[move.color][move.piece][to[0]][to[1]];
    }
  }

  return prevSum;
}

/*
 * Performs the minimax algorithm to choose the best move: https://en.wikipedia.org/wiki/Minimax (pseudocode provided)
 * Recursively explores all possible moves up to a given depth, and evaluates the game board at the leaves.
 * 
 * Basic idea: maximize the minimum value of the position resulting from the opponent's possible following moves.
 * Optimization: alpha-beta pruning: https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning (pseudocode provided)
 * 
 * Inputs:
 *  - game:                 the game object.
 *  - depth:                the depth of the recursive tree of all possible moves (i.e. height limit).
 *  - isMaximizingPlayer:   true if the current layer is maximizing, false otherwise.
 *  - sum:                  the sum (evaluation) so far at the current layer.
 *  - color:                the color of the current player.
 * 
 * Output:
 *  the best move at the root of the current subtree.
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
         [array[i], array[j]] = [array[j], array[i]];
  }
}
function ID(game,color,currSum,timeLimit){
  positionCount = 0;
  let timestart=Date.now(),
      timeend=timestart+timeLimit,
      maxDepth=4,
      bestMove,bestMoveValue,
      dis=1;
  for(;dis<=maxDepth;dis++){
    let p=minimax(game,dis,-inf,inf,true,currSum,color,true,timeend);
    if(p[0]!==-69)[bestMove, bestMoveValue]=p;
    else {dis--;break};
    //write();
    //console.log(bestMove);
  }
  var positionsPerS = (positionCount*1000 / timeLimit);
  console.log(`Positions seen:${positionCount}\nDepth:${dis--}\nAverage positions seen per second:${positionsPerS}\nMove:${bestMove.san}\nMove Value:${bestMoveValue}`);
  return [bestMove, bestMoveValue]
}
function minimax(game, depth, alpha, beta, isMaximizingPlayer, sum, color, use = true,end=0)
{
  //if(end>0&&Date.now()>=end)return [-69,-420];
  //let g = table[game.fen().replace(/\//g, "&")];
  //if (g && g[2]>=depth) { console.log("Found:"+g); return g };
  if (game.in_threefold_repetition()) {
    if (isMaximizingPlayer) {
      return [null, inf / 2];
    }
    else {
      return [null, -inf / 2]
    }
  }
  positionCount++;
  var children = game.ugly_moves({ verbose: true });

  /*if (use) {
    let p = {};
    for (var i = 0; i < children.length; i++) {
      let move = children[i],
        x = evaluateBoard(game.ugly_move(move), sum, color);
      if (p[x]) p[x].push(move);
      else p[x] = [move];
      game.undo();
    };
    let fp = Object.keys(p).sort((a, b) => a - b);
    children = fp.map(a => p[a]).flat();
  }*/

  children.sort(function(a, b) {
    return (a.captured?(pieceValue[a.captured] || -1) - pieceValue[a.piece]:0)<
    (b.captured?(pieceValue[b.captured] || -1) - pieceValue[b.piece]:0);
  });

  var currMove;
  // Maximum depth exceeded or node is a terminal node (no children)
  if (children.length === 0) {
    if (game.in_checkmate()) {
      if (isMaximizingPlayer) {
        return [null, -inf / 2 - depth];
      }
      else {
        return [null, inf / 2 + depth]
      }
    }
    return [null, sum];
  }
  else if(depth === 0){
    return [null, sum];
  }

  // Find maximum/minimum from list of 'children' (possible moves)
  var maxValue = -inf;
  var minValue = inf;
  var bestMove;
  for (var i = 0; i < children.length; i++)
  {
    currMove = children[i];

    // Note: in our case, the 'children' are simply modified game states
    var currPrettyMove = game.ugly_move(currMove);
    var newSum = evaluateBoard(currPrettyMove, sum, color);
    var [childBestMove, childValue] = minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer, newSum, color, false,end);
    //if(childBestMove===-69)return [-69,-420];

    game.undo();

    if (isMaximizingPlayer)
    {
      if (childValue > maxValue)
      {
        maxValue = childValue;
        bestMove = currPrettyMove;
      }
      if (childValue > alpha)
      {
        alpha = childValue;
      }
    }

    else
    {
      if (childValue < minValue)
      {
        minValue = childValue;
        bestMove = currPrettyMove;
      }
      if (childValue < beta)
      {
        beta = childValue;
      }
    }

    // Alpha-beta pruning
    if (alpha >= beta)
    {
      break;
    }
  }
  //let v=game.fen().replace(/\//g, "&")
  //if(!table[v] || table[v][2]<depth)table[v] = [bestMove, isMaximizingPlayer ? maxValue : minValue,depth];
  if (isMaximizingPlayer)
  {
    return [bestMove, maxValue]
  }
  else
  {
    return [bestMove, minValue];
  }
}

/*
 * Calculates the best legal move for the given color.
 */
function getBestMove(game, color, currSum, depth = 3) {
  positionCount = 0;

  var d = new Date().getTime();
  var [bestMove, bestMoveValue] = minimax(game, depth, -inf, inf, true, currSum, color);
  var d2 = new Date().getTime();
  var moveTime = (d2 - d);
  var positionsPerS = (positionCount * 1000 / moveTime);
  console.log(`Positions seen:${positionCount}\nMove Time:${moveTime/1000}\nAverage positions seen per second:${positionsPerS}\nMove:${bestMove.san}\nMove Value:${bestMoveValue}`)
  return [bestMove, bestMoveValue];
}

/* 
 * Makes the best legal move for the given color.
 */
function makeBestMove(color, depth = 3, timeLimit=0) {
  var fc=timeLimit?ID:getBestMove;
  move = fc(game, color, globalSum * ((color === 'b') ? 1 : -1), timeLimit?timeLimit:depth)[0];
  //if (!move) alert(game.fen())
  globalSum = evaluateBoard(move, globalSum, 'b');
  updateAdvantage();

  game.move(move);
  board.position(game.fen());

  if (color === 'w')
  {
    checkStatus('black');

    // Highlight black move
    $board.find('.' + squareClass).removeClass('highlight-white')
    $board.find('.square-' + move.from).addClass('highlight-white')
    squareToHighlight = move.to
    colorToHighlight = 'white'

    $board.find('.square-' + squareToHighlight)
      .addClass('highlight-' + colorToHighlight)
  }
  else
  {
    checkStatus('white');

    // Highlight white move
    $board.find('.' + squareClass).removeClass('highlight-black')
    $board.find('.square-' + move.from).addClass('highlight-black')
    squareToHighlight = move.to
    colorToHighlight = 'black'

    $board.find('.square-' + squareToHighlight)
      .addClass('highlight-' + colorToHighlight)
  }
  refresh();
  //write();
}

/* 
 * Plays Computer vs. Computer, starting with a given color.
 */
function compVsComp(color = startColour)
{
  notify(color);
  if (!checkStatus(color))
  {
    timer = window.setTimeout(function() {
      makeBestMove(color.charAt(0),depthed);
      if (color === 'white') { color = 'black' }
      else { color = 'white' }
      compVsComp(color);
    }, 250);
  }
}

/*
 * Resets the game to its initial state.
 */
function reset() {
  game.reset(x);
  globalSum = 0;
  $board.find('.' + squareClass).removeClass('highlight-white');
  $board.find('.' + squareClass).removeClass('highlight-black');
  $board.find('.' + squareClass).removeClass('highlight-hint')
  board.position(game.fen());
  $('#advantageColor').text('Neither side');
  $('#advantageNumber').text(globalSum);

  // Kill the Computer vs. Computer callback
  if (timer)
  {
    clearTimeout(timer);
    timer = null;
  }
}
/* 
 * Event listeners for various buttons.
 */
/*$('#ruyLopezBtn').on('click', function () {
    reset();
    game.load('r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1');
    board.position(game.fen());
    window.setTimeout(function() {makeBestMove('b')}, 250)
})
$('#italianGameBtn').on('click', function() {
    reset();
    game.load('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1');
    board.position(game.fen());
    window.setTimeout(function() {makeBestMove('b')}, 250)
})
$('#sicilianDefenseBtn').on('click', function() {
    reset();
    game.load('rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1');
    board.position(game.fen());
})
$('#startBtn').on('click', function() {
    reset();
})

$('#compVsCompBtn').on('click', function() {
    reset();
    compVsComp('w');
})
$('#resetBtn').on('click', function() {
    reset();
})
*/
var undo_stack = [];

function undo()
{
  var move = game.undo();
  undo_stack.push(move);

  // Maintain a maximum stack size
  if (undo_stack.length > STACK_SIZE)
  {
    undo_stack.shift();
  }
  $board.find('.' + squareClass).removeClass('highlight-white');
  $board.find('.' + squareClass).removeClass('highlight-black');
  $board.find('.' + squareClass).removeClass('highlight-hint')
  board.position(game.fen());
  checkStatus(game.turn()==="w"?"white":"black");
  updateAdvantage();
}
function redo(){
  game.move(undo_stack.pop())
  board.position(game.fen());
  checkStatus(game.turn()==="w"?"white":"black");
  updateAdvantage();
}

$('#showHint').change(function() {
  window.setTimeout(showHint, 250);
})

function showHint()
{
  var showHint = document.getElementById("showHint");
  $board.find('.' + squareClass).removeClass('highlight-hint');

  // Show hint (best move for white)
  if (!showHint.checked)
  {
    var move = getBestMove(game, 'w', -globalSum)[0];
    console.log(move)

    $board.find('.square-' + move.from).addClass('highlight-hint');
    $board.find('.square-' + move.to).addClass('highlight-hint');
  }
}

function checkStatus(color) {
  if (game.in_checkmate())
  {
    $('#status').html(`<b>Checkmate!</b> <b>${capitalize(color)}</b> lost.`);
  }
  else if (game.insufficient_material())
  {
    $('#status').html(`It's a <b>draw!</b> (Insufficient Material)`);
  }
  else if (game.in_threefold_repetition())
  {
    $('#status').html(`It's a <b>draw!</b> (Threefold Repetition)`);
  }
  else if (game.in_stalemate())
  {
    $('#status').html(`It's a <b>draw!</b> (Stalemate)`);
  }
  else if (game.in_draw())
  {
    $('#status').html(`It's a <b>draw!</b> (50-move Rule)`);
  }
  else if (game.in_check())
  {
    $('#status').html(`<b>${capitalize(color)}</b> is in <b>check!</b>`);
    return false;
  }
  else
  {
    $('#status').html(`${capitalize(color)}'s turn to move.`)
    return false;
  }
  return true;
}

function updateAdvantage()
{
  let x = (-globalSum + 2000),
    y = Math.round((x / 2000 - 1)*10000)/1000;
  if (globalSum > 0)
  {
    $('#advantageColor').text('Black');
    $('#advantageNumber').text(-y);
  }
  else if (globalSum < 0)
  {
    $('#advantageColor').text('White');
    $('#advantageNumber').text(y);
  }
  else
  {
    $('#advantageColor').text('Neither side');
    $('#advantageNumber').text(y);
  }
  if (x < 0) x = 0;
  if (x > 4000) x = 4000;
  $('#advantageBar').attr({
    style: `width: ${x / 4000 * 100}%`,
  });
}


/* 
 * The remaining code is adapted from chessboard.js examples #5000 through #5005:
 * https://chessboardjs.com/examples#5000
 */
function removeGreySquares() {
  $('#myBoard .square-55d63').css('background', '')
}

function greySquare(square) {
  var $square = $('#myBoard .square-' + square)

  var background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }
  $square.css('background', background)
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
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // Illegal move
  if (move === null) return 'snapback'

  globalSum = evaluateBoard(move, globalSum, 'b');
  updateAdvantage();

  // Highlight latest move
  $board.find('.' + squareClass).removeClass('highlight-white')

  $board.find('.square-' + move.from).addClass('highlight-white')
  squareToHighlight = move.to
  colorToHighlight = 'white'

  $board.find('.square-' + squareToHighlight)
    .addClass('highlight-' + colorToHighlight)
  refresh();
  if (!checkStatus(startColour));
  {
    // Make the best move for black
    /*window.setTimeout(function() {
      makeBestMove(startColour.charAt(0),4);
    }, 250)*/
  }
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
function capitalize(text){
  return text.charAt(0).toUpperCase()+text.slice(1);
}
function moveAll(arr) {
  for (let i = 0; i < arr.length; i++) setTimeout(() => {
    game.move(arr[i]);
    board.position(game.fen());
  }, 250 * i);
}
//moveAll(["d4","d5","Bf4","Nf6","e3","Nc6","c3","Bf5","Bd3","e6","Nf3","Be7","Nbd2"])
//moveAll(["f4","e5","fxe5","Qh4","g3","Be7"])
function generateRandom(n) {
  for (let i = 0; i < n; i++) game.move(game.moves()[~~(game.moves().length * Math.random())]);
  board.position(game.fen());
  refresh();
}
function notify(color){
  let notif=document.getElementById("notif");
  if(color!==0)notif.innerText=capitalize(color)+" is thinking...";
  else notif.innerText="Nothing is happening right now...";
}

function loadBoard(fen) {
  game.load(fen);
  board.position(fen);
  refresh();
}
let el=document.getElementById("aibt")
el.addEventListener("click",e=>{
  if(timer){el.innerText="AI vs AI";clearTimeout(timer);timer=undefined;notify(0)}
  else {el.innerText="Stop";compVsComp();};
})
//loadBoard("1k1r4/1pp4p/p7/4p3/8/P5P1/1PP4P/2K1R3 w - - 1 1");
//loadBoard("r3k2r/pp1n1ppp/1q1bpn2/1N1p2Nb/3P4/3BQ1P1/PPP2P1P/R1B2RK1 b kq - 4 13")
//game.move("")
//loadBoard("K7/7R/8/8/4k3/8/8/8 b - - 1 1");
//loadBoard("r3k2N/pppn2pp/5q2/3Pp3/Q1BP2b1/8/PP1P1bPP/RNB2K1R w q - 1 5");
//loadBoard("3qk3/pbbppbbp/1pp2pp1/8/8/1PP2PP1/PBBPPBBP/3QK3 w - - 0 1");
//loadBoard("4k3/1p4pp/2p5/8/q3r2Q/3p3P/1P4PK/4R3 b - - 1 1")
//loadBoard("r1kr4/1Rp5/p3p3/2P1qpQ1/P1P5/4B2P/6P1/1R4K1 w - - 0 36")
//loadBoard("b1bkb1b1/1b1b1b1b/b1b1b1b1/1b1b1b1b/b1b1b1b1/1b1b1b1b/b1b1b1b1/1bBbKb2 w - - 0 1")
checkStatus(startColour);
//setTimeout(()=>makeBestMove("w"),500)
updateAdvantage();