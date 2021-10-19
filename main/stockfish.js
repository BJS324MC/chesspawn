const stockfish = new Worker("stockfish/stockfish.wasm.js");
stockfish.addEventListener('message', e => {
    return console.log(e.data);
});
stockfish.postMessage('uci');