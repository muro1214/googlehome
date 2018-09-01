"use stict";
const PORT = process.env.PORT || 1880;

const BroadlinkServer = require('broadlink-rm-server');
const commands = require('./commands');

let app = BroadlinkServer(commands, true);
app.listen(PORT);

console.log('Server running, go to http://192.168.11.7:' + PORT + '/learn/command/192.168.11.6');
