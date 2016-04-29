'use strict';
const bunyan = require('bunyan');
const restify = require('restify');
const appProperties = require('./config/appProperties');
const UserRoutes = require('./routes/UserRoutes');
const RoomRoutes = require('./routes/RoomRoutes');
const SongRoutes = require('./routes/SongRoutes');
const PlaylistRoutes = require('./routes/PlaylistRoutes');

const log = bunyan.createLogger({
    name: 'name-that-song',
    streams: [
        {
            level: appProperties.stdErrLvl,
            stream: process.stdout
        },
        {
            type: 'rotating-file',
            path: 'log/api-trace.log',
            level: 'trace',
            period: '1d',
            count: 7
        }
    ]
});

const server = restify.createServer({
    name: 'name-that-song',
    version: '0.0.1'
});

server.use(
    (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        return next();
    }
);

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

//create /api/user routes
const userRoutes = new UserRoutes(server);
userRoutes.createRoutes();

//create /api/room routes
const roomRoutes = new RoomRoutes(server);
roomRoutes.createRoutes();

//create the /api/song routes
const songRoutes = new SongRoutes(server);
songRoutes.createRoutes();

//create the /api/playlist routes
const playlistRoutes = new PlaylistRoutes(server);
playlistRoutes.createRoutes();

server.listen(appProperties.serverPort, function () {
    log.debug('%s listening at %s', server.name, server.url);
});