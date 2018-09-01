exports.sleep = function (msec) {
  const date1 = new Date();
  while(true){
    const date2 = new Date();
    if(date2 - date1 > msec){
      return;
    }
  }
}
