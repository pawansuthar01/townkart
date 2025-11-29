const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const { wsServer } = require("./src/lib/websocket.ts");
const { setWebSocketServer } = require("./src/lib/notificationSystem.ts");
app
  .prepare()
  .then(async () => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    // Initialize WebSocket server
    try {
      wsServer.initialize(server);
      console.log(`> WebSocket server initialized`);

      // Initialize notification system with WebSocket server

      setWebSocketServer(wsServer);
      console.log(`> Notification system initialized with WebSocket support`);
    } catch (error) {
      console.error("Failed to initialize WebSocket server:", error);
    }

    const port = process.env.PORT || 3000;

    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });
