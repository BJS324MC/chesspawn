var firebaseConfig = {
  apiKey: "AIzaSyDNq-32lBrNQa59HjA8YWvZlUoe9yCNo7U",
  authDomain: "pongdata-e0c06.firebaseapp.com",
  databaseURL: "https://pongdata-e0c06-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pongdata-e0c06",
  storageBucket: "pongdata-e0c06.appspot.com",
  messagingSenderId: "159964586553",
  appId: "1:159964586553:web:964fcd752808c5434563e8",
  measurementId: "G-GD6WCWJKPR"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.database(),
    tab = db.ref("openings");
tab.get().then(snap=>{
  if(snap.exists()){
    openings=snap.val();
    setOpening();
  }
});
