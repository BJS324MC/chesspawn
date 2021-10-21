const express = require('express');
const app = express();
app.get('/', (request, response) => response.send('<h1>Chess Pawn!</h1>'));
app.get('/editor', (request, response) => response.send('<h1>Time to edit!</h1>'));
app.get('/explorer', (request, response) => response.send('<h1>Time to explore!</h1>'));
app.use(express.static("public",{
    setHeaders:(res,path,stat) => {
        res.set("Cross-Origin-Opener-Policy","same-origin");
        res.set("Cross-Origin-Embedder-Policy","require-corp");
    }
}));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`App listening to port ${port}`));