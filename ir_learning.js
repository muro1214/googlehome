"use stict";
require("dotenv").config();
const PORT = process.env.PORT || 1880;

const BroadlinkServer = require('broadlink-rm-server');
const commands = require('./commands');

let app = BroadlinkServer(commands, true);
app.listen(PORT);

console.log(`Server running, go to http://${process.env.NODE_RASPI_IP}:${PORT}/learn/command/${process.env.NODE_EREMOTE_IP}`);
