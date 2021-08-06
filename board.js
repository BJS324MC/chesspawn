/* 
 * A simple chess AI, by someone who doesn't know how to play chess.
 * Uses the chessboard.js and chess.js libraries.
 * 
 * Copyright (c) 2020 Zhang Zeyu
 */

var STACK_SIZE = 6000; // maximum size of undo stack

var board = null
var $board = document.querySelector('#myBoard')
var game = new Chess()
var table = {};
var depthed = 3;
var pieceValue = {
  p: 1,
  b: 3,
  n: 3,
  r: 5,
  q: 9
}
var globalSum = 0 // always from black's perspective. Negative for white's perspective.
var whiteSquareGrey = '#ff8880'
var blackSquareGrey = '#b56762'
var inf = 100000000;

var squareClass = 'square-55d63'
var squareToHighlight = null
var colorToHighlight = null
var positionCount;
var evalt;
var againstAI=false;
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
$board.addEventListener("touchmove",e=>e.preventDefault())

/* 
 * Piece Square Tables, adapted from Sunfish.py:
 * https://github.com/thomasahle/sunfish/blob/master/sunfish.py
 */

var sortType={'p':1,'n':0,'b':2,'r':4,'q':3,'k':5};
var weights = { 'p': 100, 'n': 280, 'b': 320, 'r': 479, 'q': 929, 'k': 20000, 'k_e': 20000 };
var pst_w = {
  p: [
  		[0, 0, 0, 0, 0, 0, 0, 0],
  		[50, 50, 50, 50, 50, 50, 50, 50],
  		[10, 10, 20, 30, 30, 20, 10, 10],
  		[5, 5, 10, 25, 25, 10, 5, 5],
  		[0, 0, 0, 20, 20, 0, 0, 0],
  		[5, -5, -10, 0, 0, -10, -5, 5],
  		[5, 10, 10, -20, -20, 10, 10, 5],
  		[0, 0, 0, 0, 0, 0, 0, 0]
  	],
  // knight
  n: [
  		[-50, -40, -30, -30, -30, -30, -40, -50],
  		[-40, -20, 0, 0, 0, 0, -20, -40],
  		[-30, 0, 10, 15, 15, 10, 0, -30],
  		[-30, 5, 15, 20, 20, 15, 5, -30],
  		[-30, 0, 15, 20, 20, 15, 0, -30],
  		[-30, 5, 10, 15, 15, 10, 5, -30],
  		[-40, -20, 0, 5, 5, 0, -20, -40],
  		[-50, -40, -30, -30, -30, -30, -40, -50]
  	],
  // bishop
  b: [
  		[-20, -10, -10, -10, -10, -10, -10, -20],
  		[-10, 0, 0, 0, 0, 0, 0, -10],
  		[-10, 0, 5, 10, 10, 5, 0, -10],
  		[-10, 5, 5, 10, 10, 5, 5, -10],
  		[-10, 0, 10, 10, 10, 10, 0, -10],
  		[-10, 10, 10, 10, 10, 10, 10, -10],
  		[-10, 5, 0, 0, 0, 0, 5, -10],
  		[-20, -10, -10, -10, -10, -10, -10, -20]
  	],
  // rook
  r: [
  		[0, 0, 0, 0, 0, 0, 0, 0],
  		[5, 10, 10, 10, 10, 10, 10, 5],
  		[-5, 0, 0, 0, 0, 0, 0, -5],
  		[-5, 0, 0, 0, 0, 0, 0, -5],
  		[-5, 0, 0, 0, 0, 0, 0, -5],
  		[-5, 0, 0, 0, 0, 0, 0, -5],
  		[-5, 0, 0, 0, 0, 0, 0, -5],
  		[0, 0, 0, 5, 5, 0, 0, 0]
  	],
  // queen
  q: [
  		[-20, -10, -10, -5, -5, -10, -10, -20],
  		[-10, 0, 0, 0, 0, 0, 0, -10],
  		[-10, 0, 5, 5, 5, 5, 0, -10],
  		[-5, 0, 5, 5, 5, 5, 0, -5],
  		[0, 0, 5, 5, 5, 5, 0, -5],
  		[-10, 5, 5, 5, 5, 5, 0, -10],
  		[-10, 0, 5, 0, 0, 0, 0, -10],
  		[-20, -10, -10, -5, -5, -10, -10, -20]
  	],
  // king middle game
  k: [
  		[-30, -40, -40, -50, -50, -40, -40, -30],
  		[-30, -40, -40, -50, -50, -40, -40, -30],
  		[-30, -40, -40, -50, -50, -40, -40, -30],
  		[-30, -40, -40, -50, -50, -40, -40, -30],
  		[-20, -30, -30, -40, -40, -30, -30, -20],
  		[-10, -20, -20, -20, -20, -20, -20, -10],
  		 [20, 20, 0, 0, 0, 0, 20, 20],
  		 [20, 30, 10, 0, 0, 10, 30, 20]
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

for (let i in pst_w) {
  pst_w[i] = pst_w[i].flat();
  pst_b[i] = pst_b[i].flat();
};
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
function forObj(ob,f){
  for(let i in ob)if(!isNaN(Number(i)))f(ob[i],i);
}
/* 
 * Evaluates the board at this point in time, 
 * using the material weights and piece square tables.
 */
function evaluateBoard(move, prevSum, color)
{
  var from = [(8 - parseInt(move.from[1])) * 8 + (move.from.charCodeAt(0) - 'a'.charCodeAt(0))];
  var to = [(8 - parseInt(move.to[1])) * 8 + (move.to.charCodeAt(0) - 'a'.charCodeAt(0))];

  // Change endgame behavior for kings
  if (prevSum < -1500)
  {
    if (move.piece === 'k') { move.piece = 'k_e' }
    else if (move.captured === 'k') { move.captured = 'k_e' }
  }
  let mc = pstSelf[move.color];
  mp = mc[move.piece];
  if ('captured' in move)
  {
    // Opponent piece was captured (good for us)
    if (move.color === color)
    {
      prevSum += (weights[move.captured] + pstOpponent[move.color][move.captured][to]);
    }
    // Our piece was captured (bad for us)
    else
    {
      prevSum -= (weights[move.captured] + mc[move.captured][to]);
    }
  }
  if (move.flags.includes('p'))
  {
    // NOTE: promote to queen for simplicity
    move.promotion = 'q';

    // Our piece was promoted (good for us)
    if (move.color === color)
    {
      prevSum -= (weights[move.piece] + mp[from]);
      prevSum += (weights[move.promotion] + mc[move.promotion][to]);
    }
    // Opponent piece was promoted (bad for us)
    else
    {
      prevSum += (weights[move.piece] + mp[from]);
      prevSum -= (weights[move.promotion] + mc[move.promotion][to]);
    }
  }
  else
  {
    // The moved piece still exists on the updated board, so we only need to update the position value
    if (move.color !== color)
    {
      prevSum += mp[from];
      prevSum -= mp[to];
    }
    else
    {
      prevSum -= mp[from];
      prevSum += mp[to];
    }
  }

  return prevSum;
}
function evaluateBoardNow(color="w"){
  return game.board().reduce((t,a,r)=>t+a.reduce((h,b,c)=>h+(b?(weights[b.type]+pstSelf[b.color][b.type][r*8+c])*(color===b.color?1:-1):0),0),0)
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

function ID(game, color, currSum, timeLimit) {
  positionCount = 0;
  let timestart = Date.now(),
    timeend = timestart + timeLimit,
    maxDepth = 4,
    bestMove, bestMoveValue,
    dis = 1;
  for (; dis <= maxDepth; dis++) {
    let p = minimax(game, dis, -inf, inf, true, currSum, color, true, timeend);
    if (p[0] !== -69)[bestMove, bestMoveValue] = p;
    else { dis--; break };
    //write();
    //console.log(bestMove);
  }
  var positionsPerS = (positionCount * 1000 / timeLimit);
  console.log(`Positions seen:${positionCount}\nDepth:${dis--}\nAverage positions seen per second:${positionsPerS}\nMove:${bestMove.san}\nMove Value:${bestMoveValue}`);
  return [bestMove, bestMoveValue]
}

function quiescenceSearch(game, alpha, beta,isMaximizingPlayer, color="w",ln=0) {
  var standPatValue = evaluateBoardNow(color);
  evalt++;
  if(ln===3)return standPatValue;
  let delta = 929;
  if (isMaximizingPlayer) {
    if (standPatValue >= beta) {
      return beta;
    }
    if (standPatValue < alpha - delta) return alpha;
    alpha = (standPatValue > alpha) ? standPatValue : alpha;
  } else {
    if (standPatValue <= alpha) {
      return alpha;
    }
    if (standPatValue > beta + delta) return beta;
    beta = (standPatValue < beta) ? standPatValue : beta;
  }//game.in_check()?true:
  var moves = game.ugly_moves({ verbose: true }).filter(a=>game.in_check()?true:a.captured);

  for (var i = 0; i < moves.length; i++) {
    game.ugly_move(moves[i]);
    var value = quiescenceSearch(game, alpha, beta,!isMaximizingPlayer, color,ln+1);
    game.undo();

    if (isMaximizingPlayer) {
      if (value >= beta) {
        return beta;
      }
      alpha = (value > alpha) ? value : alpha; // max player (white)
    } else {
      if (value <= alpha) {
        return alpha;
      }
      beta = (value < beta) ? value : beta; // min player (black)
    }
  }

  return (isMaximizingPlayer ? alpha : beta);
}

function minimax(game, depth, alpha, beta, isMaximizingPlayer, sum, color, use = true, end = 0,tabl={})
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
  }
  .sort(function(a, b) {
    return (pieceValue[b.captured] / pieceValue[b.piece]) - (pieceValue[a.captured] / pieceValue[a.piece]);
  });
  .sort(function(a, b) {
    return sortType[b.type] - sortType[a.type];
  });
  */

  children.sort(function(a, b) {
    return (b.captured?pieceValue[b.captured] / pieceValue[b.piece]:0) - (a.captured?pieceValue[a.captured] / pieceValue[a.piece]:0);
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
    return [null, 0];
  }
  else if (depth === 0) {
    return [null, quiescenceSearch(game, alpha, beta,isMaximizingPlayer, color)];
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
    tabl[currPrettyMove.san]={};
    //var newSum = evaluateBoard(currPrettyMove, sum, color);
    var [childBestMove, childValue,ttt] = minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer, 0, color, false, end,tabl[currPrettyMove.san]);
    if(!childBestMove)tabl[currPrettyMove.san]=childValue;
    //if(childBestMove===-69)return [-69,-420];

    game.undo();

    if (isMaximizingPlayer)
    {
      if (childValue > maxValue)
      {
        maxValue = childValue;
        bestMove = currPrettyMove;
        tabl={[bestMove.san]:tabl[bestMove.san]};
        //for(let i in tabl)if(i!==bestMove.san)delete tabl[i];
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
        tabl={[bestMove.san]:tabl[bestMove.san]};
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
    return [bestMove, maxValue,tabl]
  }
  else
  {
    return [bestMove, minValue,tabl];
  }
}

/*
 * Calculates the best legal move for the given color.
 */
function getBestMove(game, color, currSum, depth = 3) {
  positionCount = 0;
  evalt=0;
  var d = new Date().getTime();
  var [bestMove, bestMoveValue,ttt] = minimax(game, depth, -inf, inf, true, currSum, color);
  var d2 = new Date().getTime();
  var moveTime = (d2 - d);
  var positionsPerS = (positionCount * 1000 / moveTime);
  console.log(`Positions seen:${positionCount}\nMove Time:${moveTime/1000}\nAverage positions seen per second:${positionsPerS}\nMove:${bestMove.san}\nMove Value:${bestMoveValue}\nEvaluations:${evalt}\nLine:${JSON.stringify(ttt)}`)
  return [bestMove, bestMoveValue];
}

/* 
 * Makes the best legal move for the given color.
 */
function makeBestMove(color, depth = 3, timeLimit = 0) {
  var move,
  sd=evaluateBoardNow(color);
  if(!(move=randomOpening())){
  var fc = timeLimit ? ID : getBestMove;
  move = fc(game, color, globalSum * ((color === 'b') ? 1 : -1), timeLimit ? timeLimit : depth)[0];
  //if (!move) alert(game.fen())
 //evaluateBoard(move, globalSum, 'b');
  playMove(move);
  console.log("Advantage Change:"+(evaluateBoardNow(color)-sd))}

  if (color === 'w')
  {
    checkStatus('black');

    // Highlight black move
    forObj($board.querySelectorAll('.' + squareClass),a=>a.classList.remove('highlight-white'))
    forObj($board.querySelectorAll('.square-' + move.from),a=>a.classList.add('highlight-white'))
    squareToHighlight = move.to
    colorToHighlight = 'white'

    forObj($board.querySelectorAll('.square-' + squareToHighlight),a=>a
      .classList.add('highlight-' + colorToHighlight))
  }
  else
  {
    checkStatus('white');

    // Highlight white move
    forObj($board.querySelectorAll('.' + squareClass),a=>a.classList.remove('highlight-black'))
    forObj($board.querySelectorAll('.square-' + move.from),a=>a.classList.add('highlight-black'))
    squareToHighlight = move.to
    colorToHighlight = 'black'

    forObj($board.querySelectorAll('.square-' + squareToHighlight),a=>a
      .classList.add('highlight-' + colorToHighlight))
  }
  refresh();
  //write();
}

/* 
 * Plays Computer vs. Computer, starting with a given color.
 */
function compVsComp(color = startColour)
{
  if (!checkStatus(color)){
    notify(color);
    timer = setTimeout(function() {
      makeBestMove(color.charAt(0), depthed);
      if (color === 'white') { color = 'black' }
      else { color = 'white' }
      compVsComp(color);
    }, 250);
  }
  else{
    alert("Game over");
  }
}
function playMove(m){
  let mv=game.move(m);
  board.position(game.fen());
  globalSum = evaluateBoardNow("b");
  updateAdvantage();
  setOpening();
  return mv;
}
/*x
 * Resets the game to its initial state.
 */
function reset() {
  game.reset(x);
  globalSum = 0;
  forObj($board.querySelectorAll('.' + squareClass),a=>a.classList.remove('highlight-white'));
  forObj($board.querySelectorAll('.' + squareClass),a=>a.classList.remove('highlight-black'));
  forObj($board.querySelectorAll('.' + squareClass),a=>a.classList.remove('highlight-hint'))
  board.position(game.fen());
  document.querySelector('#advantageColor').text('Neither side');
  document.querySelector('#advantageNumber').text(globalSum);

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
  forObj($board.querySelectorAll('.' + squareClass),a=>a.classList.remove('highlight-white'));
  forObj($board.querySelectorAll('.' + squareClass),a=>a.classList.remove('highlight-black'));
  forObj($board.querySelectorAll('.' + squareClass),a=>a.classList.remove('highlight-hint'));
  board.position(game.fen());
  checkStatus(game.turn() === "w" ? "white" : "black");
  globalSum = evaluateBoardNow("b");
  updateAdvantage();
  setOpening()
}

function redo() {
  playMove(undo_stack.pop())
}

/*document.querySelector('#showHint').addEventListener("change",function() {
  window.setTimeout(showHint, 250);
});*/

function showHint()
{
  var showHint = document.getElementById("showHint");
  forObj($board.querySelectorAll('.' + squareClass),a=>a.classList.remove('highlight-hint'));

  // Show hint (best move for white)
  if (!showHint.checked)
  {
    var move = getBestMove(game, 'w', -globalSum)[0];
    console.log(move)

    forObj($board.querySelectorAll('.square-' + move.from),a=>a.classList.add('highlight-hint'));
    forObj($board.querySelectorAll('.square-' + move.to),a=>a.classList.add('highlight-hint'));
  }
}

function checkStatus(color) {
  if (game.in_checkmate())
  {
    document.querySelector('#status').innerHTML=(`<b>Checkmate!</b> <b>${capitalize(color)}</b> lost.`);
  }
  else if (game.insufficient_material())
  {
    document.querySelector('#status').innerHTML=(`It's a <b>draw!</b> (Insufficient Material)`);
  }
  else if (game.in_threefold_repetition())
  {
    document.querySelector('#status').innerHTML=(`It's a <b>draw!</b> (Threefold Repetition)`);
  }
  else if (game.in_stalemate())
  {
    document.querySelector('#status').innerHTML=(`It's a <b>draw!</b> (Stalemate)`);
  }
  else if (game.in_draw())
  {
    document.querySelector('#status').innerHTML=(`It's a <b>draw!</b> (50-move Rule)`);
  }
  else if (game.in_check())
  {
    document.querySelector('#status').innerHTML=(`<b>${capitalize(color)}</b> is in <b>check!</b>`);
    return false;
  }
  else
  {
    document.querySelector('#status').innerHTML=`${capitalize(color)}'s turn to move.`
    return false;
  }
  return true;
}

function updateAdvantage()
{
  let x = (-globalSum + 2000),
    y = Math.round((x / 2000 - 1) * 10000) / 1000;
  if (globalSum > 0)
  {
    document.querySelector('#advantageColor').innerText=('Black');
    document.querySelector('#advantageNumber').innerText=(-y);
  }
  else if (globalSum < 0)
  {
    document.querySelector('#advantageColor').innerText=('White');
    document.querySelector('#advantageNumber').innerText=(y);
  }
  else
  {
    document.querySelector('#advantageColor').innerText=('Neither side');
    document.querySelector('#advantageNumber').innerText=(y);
  }
  if (x < 0) x = 0;
  if (x > 4000) x = 4000;
  document.querySelector('#advantageBar').style.width=(x / 4000 * 100)+"%";
}


/* 
 * The remaining code is adapted from chessboard.js examples #5000 through #5005:
 * https://chessboardjs.com/examples#5000
 */
function removeGreySquares() {
  forObj(document.querySelectorAll('#myBoard .square-55d63'),a=>a.style.background="");
}

function greySquare(square) {
  var $square = document.querySelector('#myBoard .square-' + square)

  var background = whiteSquareGrey
  if ($square.classList.contains('black-3c85d')) {
    background = blackSquareGrey
  }
  $square.style.background=background
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

  globalSum = evaluateBoardNow('b');
  updateAdvantage();

  // Highlight latest move
  forObj($board.querySelectorAll('.' + squareClass),a=>a.classList.remove('highlight-white'))

  forObj($board.querySelectorAll('.square-' + move.from),a=>a.classList.add('highlight-white'))
  squareToHighlight = move.to
  colorToHighlight = 'white'

  forObj($board.querySelectorAll('.square-' + squareToHighlight),a=>a
    .classList.add('highlight-' + colorToHighlight))
  refresh();
  setOpening();
  if (!checkStatus(startColour));
  {
    if(againstAI){notify(startColour);setTimeout(function() {
      makeBestMove(game.turn(),3);
      notify(0);
    }, 250);}
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

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
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

function notify(color) {
  if (color !== 0) document.querySelector('#status').innerHTML=capitalize(color)+" is thinking...";
}

function loadBoard(fen) {
  game.load(fen);
  board.position(fen);
  refresh();
}
let el = document.getElementById("aibt"),
em=document.getElementById("avbt");
el.addEventListener("click", e => {
  if (timer) { el.innerText = "AI vs AI";
    clearTimeout(timer);
    timer = undefined;
    notify(0) }
  else { el.innerText = "Stop";
    compVsComp(); };
})
em.addEventListener("click",e=>{
  againstAI=!againstAI;
  if(againstAI)em.innerText="Stop";
  else em.innerText="Against AI";
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