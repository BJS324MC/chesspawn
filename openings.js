function addOpening(name="",list=game.history()){
  var pl=searchOpening();
  pl.name=name;
  db.ref("openings").update(openings);
}
function searchOpening(list=game.history()){
  let pl = openings;
  for (let a of list) {
    if (!pl[a]) pl[a] = { name: "" };
    pl = pl[a];
  };
  return pl;
}
function pickRandom(arr){
  arr=arr.filter(a=>a!=="name")
  return arr[Math.floor(Math.random()*arr.length)];
}
function getOpening(list=game.history()){
  let pl = openings;
  for (let a of list) {
    if (!pl[a]) return false;
    pl = pl[a];
  };
  return pl;
}
function randomOpening(list=game.history()){
  let open=getOpening(list);
  if(open)return pickRandom(Object.keys(open));
  return false;
}
function setOpening(){
  let open=getOpening();
  if(open)document.getElementById("opening").innerText=open.name;
}
/*
{
  "e4":{"e5":{"name":"King's Pawn Opening, 1...e5"},"name":"King's Pawn Opening"}
  "d4":{"e5":{"name":"Scandinavian Defense"},"name":"Queen's Pawn Opening"}
  "name":"Starting Position"
}
{
  "startfen":["e4","d4",Starting Position"]
  "e4fen":["e5","King's Pawn Opening"]
}
function pgnfen(tb){
  for(let i in tb){
  let m=game.move
    openings[]
  };
}
function add(name){
  openings[game.fen()]=[]
  db.ref("open").update({})
}
*/