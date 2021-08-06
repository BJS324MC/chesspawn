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
  if(open)return playMove(pickRandom(Object.keys(open)));
  return false;
}
function setOpening(){
  let open=getOpening();
  if(open)document.getElementById("opening").innerText=open.name;
}