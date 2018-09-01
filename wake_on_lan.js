var wol = require("wake_on_lan");

exports.wakeUp = function(macAddr) {
  console.log(`このPCを立ち上げます : ${macAddr}`);

  wol.wake(macAddr, function(error) {
    if(error){
      console.log(error);
    }else{
      console.log(`このPCを立ち上げました : ${macAddr}`);
    }
  });
}
