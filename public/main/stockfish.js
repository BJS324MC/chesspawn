let pvNodes = 1,
    running = true,
    loading = false;

const isSupported = () => {
    if (typeof WebAssembly !== "object") return false;
    const source = Uint8Array.from([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 7, 8,
        1, 4, 116, 101, 115, 116, 0, 0, 10, 15, 1, 13, 0, 65, 0, 253, 17, 65, 0,
        253, 17, 253, 186, 1, 11,
    ]);
    if (
        typeof WebAssembly.validate !== "function" ||
        !WebAssembly.validate(source)
    )
        return false;
    if (typeof Atomics !== "object") return false;
    if (typeof SharedArrayBuffer !== "function") return false;
    return true;
};

const reanalyse = () => {
    loading = true;
    document.querySelector("#evaluation").innerText = "-";
    if (running) stockfish.postMessage("stop");
    else {
        stockfish.postMessage(`position fen ${game.fen()}`);
        stockfish.postMessage('go infinite');
    }
};

let stockfish = null;

if (isSupported()) (async () => {
    //{ wasmBinary: await (await fetch("stockfish/stockfish.wasm")).arrayBuffer() }
    stockfish = await Stockfish();
    stockfish.addMessageListener(e => {
        console.log(e);
        if (e.includes("currmove")) return;
        if (e.startsWith("info") && !loading) {
            const data = e.split(" "),
                mate = data.indexOf("mate") + 1,
                d = game.turn() === "w" ? 1 : -1;
            if (mate !== 0) {
                const n = data[mate] * d;
                document.querySelector("#evaluation").innerText = n === 0 ? "-" : `#${n}`;
                if (n !== 0) document.querySelector('#advantageBar').style.width = n > 0 ? "100%" : "0%";
            }
            else updateAdvantage(data[data.indexOf("cp") + 1] * d);
        }
        else if (e.startsWith("bestmove")) {
            if (loading) {
                loading = false;
                running = true;
                stockfish.postMessage(`position fen ${game.fen()}`);
                stockfish.postMessage('go infinite');
            }
            else{
                running = false;
            }
        }
    });
    stockfish.postMessage('uci');
    stockfish.postMessage('setoption name UCI_AnalyseMode value true');
    stockfish.postMessage('setoption name UCI_Chess960 value true');
    stockfish.postMessage('go infinite');
})();
else alert("Your browser does not support Stockfish!");