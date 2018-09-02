const express = require("express");
const eorzeaWeather = require("./../weathers");
const zoneList = require("./../eorzea_zones");

var router = express.Router();

router.get("/forecast/:zoneId", function(req, res) {
  if(!zoneList[req.params.zoneId]){
    res.status(404);
  	res.end('Not Found : ' + req.path);
    return;
  }
	const weathers = eorzeaWeather.getWeathers({zoneId: zoneList[req.params.zoneId], locale: "ja"});
	res.header('Content-Type', 'application/json; charset=utf-8');

  const time = req.query.time;
  if(time){
    if(time == "past"){
      res.send(weathers[0]);
    }else if(time == "now"){
      res.send(weathers[1]);
    }else if(time == "future"){
      weathers.splice(0, 2);
    }
  }
  res.send(weathers);
});

module.exports = router;
