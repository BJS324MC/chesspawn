const $board = document.querySelector('#myBoard'),
  game = new Chess(),
  whiteSquareGrey = '#ff8880',
  blackSquareGrey = '#b56762',
  squareClass = 'square-55d63';

let undo_stack = [];
$board.addEventListener("touchmove", e => e.preventDefault());

const afterMove = move => {
  board.position(game.fen());
  if (move) playSound(
    game.in_checkmate() ? "checkmate" :
      game.in_draw() ? "draw" :
        game.in_check() ? "check" :
          (move.flags === "k" || move.flags === "q" || move.flags.includes("p")) ? "castle" :
            ("captured" in move) ? "capture" : "move");
  const turn = game.turn() === 'b' ? "white" : "black";
  forObj($board.querySelectorAll(`.${squareClass}`), a => a.classList.remove(`highlight-${turn}`));
  forObj($board.querySelectorAll(`.square-${move.from}`), a => a.classList.add(`highlight-${turn}`));
  forObj($board.querySelectorAll(`.square-${move.to}`), a => a.classList.add(`highlight-${turn}`));
  reanalyse();
  return move;
},
  playMove = m => {
    if (!m) return false;
    const move = game.move(m, { sloppy: true });
    return afterMove(move);
  },
  undo = () => {
    const move = game.undo();
    undo_stack.push(move);
    return afterMove(move);
  },
  redo = () => playMove(undo_stack.pop()),
  showHint = () => {
    const showHint = document.getElementById("showHint");
    forObj($board.querySelectorAll('.' + squareClass), a => a.classList.remove('highlight-hint'));

    if (!showHint.checked) {
      const move = getBestMove();
      forObj($board.querySelectorAll('.square-' + move.from), a => a.classList.add('highlight-hint'));
      forObj($board.querySelectorAll('.square-' + move.to), a => a.classList.add('highlight-hint'));
    }
  },
  removeGreySquares = () => forObj(document.querySelectorAll('#myBoard .square-55d63'), a => a.style.background = ""),
  greySquare = square => {
    const $square = document.querySelector('#myBoard .square-' + square);
    $square.style.background = $square.classList.contains('black-3c85d') ? blackSquareGrey : whiteSquareGrey;
  },
  updateAdvantage = cp => {
    document.querySelector('#evaluation').innerText = cp / 200;
    document.querySelector('#advantageBar').style.width = 100 - Math.min(100,Math.max(0,((2000 - cp) / 40))) + "%";
  },
  checkStatus = color =>
    document.querySelector('#status').innerHTML =
    game.in_checkmate() ? `<b>Checkmate.</b> <b>${capitalize(color)}</b> lost.`
      : game.insufficient_material() ? "<b>Draw</b> by insufficient material"
        : game.in_threefold_repetition() ? "<b>Draw</b> by threefold repetition"
          : game.in_stalemate() ? "<b>Draw</b> by stalemate"
            : game.in_draw() ? "<b>Draw</b> by 50-move rule."
              : "",
  onDragStart = (square, piece) => {
    if (game.game_over() || (game.turn() === 'w' && piece.search(/^b/) !== -1) || (game.turn() === 'b' && piece.search(/^w/) !== -1))
      return false;
    game.moves({
      square: square,
      verbose: true
    }).forEach(move => greySquare(move.to));
  },
  onDrop = (source, target) => {
    undo_stack = [];
    removeGreySquares();
    const move = game.move({
      from: source,
      to: target,
      promotion: 'q'
    });
    if (move === null) return 'snapback';
    playSound(
      game.in_checkmate() ? "checkmate" :
        game.in_draw() ? "draw" :
          game.in_check() ? "check" :
            (move.flags === "k" || move.flags === "q" || move.flags.includes("p")) ? "castle" :
              ("captured" in move) ? "capture" : "move");
    forObj($board.querySelectorAll(`.${squareClass}`), a => a.classList.remove('highlight-white'));
    forObj($board.querySelectorAll(`.square-${move.from}`), a => a.classList.add('highlight-white'));
    forObj($board.querySelectorAll(`.square-${move.to}`), a => a.classList.add(`highlight-white`));
    reanalyse();
  },
  onMouseoverSquare = (square, piece) => game.moves({ square: square, verbose: true }).forEach(move => greySquare(move.to)),
  onMouseoutSquare = (square, piece) => removeGreySquares(),
  onSnapEnd = () => board.position(game.fen()),
  loadBoard = fen => {
    game.load(fen);
    board.position(fen);
    reanalyse();
  }

const board = Chessboard('myBoard', {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd,
})