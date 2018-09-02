// requires
var firebase = require("firebase-admin");
var request = require("sync-request");
var broadlink = require("./getDevice");
var izunaUtil = require("./izuna_util");
var wol = require("./wake_on_lan");
require("dotenv").config();

// IR lists
// var bedroomLightList = require("./ir/light_bedroom");
var lightList = require("./ir/light_living");
var tvList = require("./ir/tv");
var recorderList = require("./ir/recorder");
var airconList = require("./ir/aircon");

// Initialize Firebase
var serviceAccount = require("./" + process.env.NODE_FIREBASE_KEY);
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: process.env.NODE_FIREBASE_DB_HOST
});

// eRemote mini Device set
const eRemoteIP = process.env.NODE_EREMOTE_IP;
let eRemote = {};
const timer = setInterval(function() {
  eRemote = broadlink({host: eRemoteIP});
  if(eRemote){
    clearInterval(timer);
  }
}, 100);

// eRemote mini IR send
const irSend = (irData) => {
  console.log("send IR data");
  const hexDataBuffer = new Buffer(irData, "hex");
  eRemote.sendData(hexDataBuffer);
}

// jsonからvalueに一致する値を取得する
const getJsonData = (value, json) => {
  for(var word in json) {
    if(value == word){
      return json[word];
    }
  }
  return json["default"];
}

// 現在のPower状態を取得
const getNowPowerStatus = (target) => {
  return request(
    "GET",
    `${process.env.NODE_FIREBASE_DB_HOST}/${target}/power.json?auth=${process.env.NODE_FIREBASE_DB_AUTH}`
  ).getBody("utf8").replace(/\"/g, "");
}

// PowerのIRを送る必要があるか調べる
const checkPowerStatus = (target, command) => {
  if(command != "on" && command != "off"){
    return command;
  }

  const nowStatus = getNowPowerStatus(target);

  if(nowStatus == command){ //現在TVかレコーダーがついてて、onの指示がきたときは何もしない
    return false;
  }else{
    database.ref("/" + target ).update({power: command});
    return "power";
  }
}

// database更新時の処理
const database = firebase.database();
database.ref("/googlehome").on("value", function(changedSnapshot) {
  // 値を取得する
  var value = changedSnapshot.child("word").val();
  if(!value){
    return;
  }
  console.log("value = " + value);

  // 助詞は削除ォ
  value = value.replace(/ [のをが]/g, "");

  // コマンド生成
  var values = value.split(" ");
  var command = getJsonData(values[0], {
    // オタクの帰宅
    "OTAKU_no_KITAKU": () => {
      return "OTAKU no KITAKU";
    },

    // オタクの出発
    "OTAKU_no_SHUPPATSU": () => {
      return "OTAKU no SHUPPATSU";
    },

    // PC立ち上げ
    "Wake_on_LAN": () => {
      return "Wake on LAN";
    },

    // リビングの照明 -> 寝室も同じ信号にした
    "light": () => {
      var command = getJsonData(values[1], {
        "つけ": "max",
        "オン": "max",
        "消し": "off",
        "けし": "off",
        "オフ": "off",
        "シーン": "scene",
        "夜": "night",
        "暗く": "night",
        "default": false
      })
      return command ? () => irSend(lightList[command]) : command;
    },

    // // ベッドルームの照明
    // "bedroom_light": () => {
    //   var command = getJsonData(values[1], {
    //     "つけ": "max",
    //     "オン": "max",
    //     "消し": "off",
    //     "けし": "off",
    //     "オフ": "off",
    //     "シーン": "scene",
    //     "夜": "night",
    //     "暗く": "night",
    //     "default": false
    //   })
    //   return command ? () => irSend(bedroomLightList[command]) : command;
    // },

    // エアコン
    "aircon": () => {
      var command = getJsonData(values[1], {
        "暖房": "heat",
        "冷房": "cool",
        "除湿": "dehumidify",
        "送風": "fan",
        "温度": getJsonData(values[2], {
          "上げ": "up",
          "あげ": "up",
          "下げ": "down",
          "さげ": "down",
          "default": false
        }),
        "上げ": "up",
        "あげ": "up",
        "下げ": "down",
        "さげ": "down",
        "風速": "speed",
        "風向": "direction",
        "消し": "off",
        "けし": "off",
        "止め": "off",
        "とめ": "off",
        "停止": "off",
        "default": false
      })
      return command ? () => irSend(airconList[command]) : command;
    },

    // テレビ
    "tv": () => {
      var command = getJsonData(values[1], {
        "つけ": "on",
        "オン": "on",
        "消し": "off",
        "けし": "off",
        "オフ": "off",
        "音量": getJsonData(values[2], {
          "上げ": "up",
          "あげ": "up",
          "下げ": "down",
          "さげ": "down",
          "default": false
        }),
        "上げ": "up",
        "あげ": "up",
        "下げ": "down",
        "さげ": "down",
        "入力": getJsonData(values[2], {
          "切り替え": "input",
          "切替": "input",
          "きりかえ": "input",
          "default": false
        }),
        "切替": "input",
        "きりかえ": "input",
        "default": false
      })
      command = checkPowerStatus("tv", command);
      return command ? () => irSend(tvList[command]) : command;
    },

    // BDレコーダー
    "recorder": () => {
      var command = getJsonData(values[1], {
        "つけ": "on",
        "オン": "on",
        "消し": "off",
        "けし": "off",
        "オフ": "off",
        "番組表": "schedule",
        "NHK": getJsonData(values[2], {
          "総合": "ch1",
          "E": "ch2",
          "Eてれ": "ch2",
          "Eテレ": "ch2",
          "default": false
        }),
        "TVK": "ch3",
        "tvk": "ch3",
        "日テレ": "ch4",
        "テレビ朝日": "ch5",
        "TBS": "ch6",
        "tbs": "ch6",
        "テレビ東京": "ch7",
        "テレ東": "ch7",
        "フジテレビ": "ch8",
        "東京MX": "ch9",
        "default": false
      })
      command = checkPowerStatus("recorder", command);
      return command ? () => irSend(recorderList[command]) : command;
    },

    // default
    "default": () => false,
  })();
  console.log("command = " + command);

  // コマンド実行
  if(command){
    if(typeof command === "string"){
      if(command == "OTAKU no KITAKU"){ //リビングの照明とTVをONにする
        wol.wakeUp(process.env.NODE_PC_MAC);
        irSend(lightList["max"]);
        if(checkPowerStatus("tv","on")){
          irSend(tvList["power"]);
        }
      }else if(command == "OTAKU no SHUPPATSU"){ //すべての照明とTVをOFFにする
        irSend(lightList["off"]);
        if(checkPowerStatus("tv", "off")){
          irSend(tvList["power"]);
        }
      }else if(command == "Wake on LAN"){
        wol.wakeUp(process.env.NODE_PC_MAC);
      }
    }else if(typeof command === "function"){
      command();
    }else{
      console.log("なにもしません");
    }

    // clear firebase
    database.ref("/googlehome").set({word: ""});
  }
})
