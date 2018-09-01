const nfcpyId = require('node-nfcpy-id').default;
var firebase = require("firebase-admin");
var request = require("sync-request");
require("dotenv").config();

const nfc = new nfcpyId({mode: "non-touchend"});
nfc.start();
console.log("NFCタグの読み取りを開始しました");

// firebase initialize
var serviceAccount = require("./" + process.env.NODE_FIREBASE_KEY);
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: process.env.NODE_FIREBASE_DB_HOST
});

const accepted = process.env.NODE_ACCEPTED_CARDS;
nfc.on("touchstart", (card) => {
  console.log(`カードを検出しました (ID : ${card.id}, Type : ${card.type})`);
  if(accepted.includes(card.id)){
    console.log("許可したカードを検出したため、家電を操作します");
    // 在室状況を取得
    var inRoom =  request(
      "GET",
      `${process.env.NODE_FIREBASE_DB_HOST}/izuna/inroom.json?auth=${process.env.NODE_FIREBASE_DB_AUTH}`
    ).getBody("utf8").replace(/\"/g, "");

    // 在室状況に応じて、操作を変える
    var operation = ""
    if(inRoom == "yes"){ // 在室中なら外出の操作
      console.log("在室中なので外出の処理を実行します");
      operation = "OTAKU_no_SHUPPATSU";
      inRoom = "no";
    }else if(inRoom == "no"){ // 外出中なら帰宅の操作
      console.log("外出から戻ったので帰宅の処理を実行します");
      operation = "OTAKU_no_KITAKU";
      inRoom = "yes";
    }

    // firebaseにデータを投げる
    firebase.database().ref("/googlehome").set({word: operation});
    firebase.database().ref("/izuna").set({inroom: inRoom});
  }
  setTimeout(() => {
    console.log("読み取りを再開します");
    nfc.start();
  }, 5000);
});
