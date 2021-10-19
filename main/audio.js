const audioCtx = new AudioContext(),
    buffers = {},
    addSound = async type => buffers[type] = audioCtx.decodeAudioData(await (await fetch(`./sounds/${type}.wav`)).arrayBuffer()),
    playSound = type => {
        const source = audioCtx.createBufferSource();
        source.buffer = buffers[type];
        source.connect(audioCtx.destination);
        source.start(0);
    };
["move", "capture", "check", "castle", "checkmate", "draw"].forEach(addSound);