import http from 'http';
import app from '../app';

let port: number | string = 8080;
if (process.env.PORT) {
  const parsedPort = parseInt(process.env.PORT, 10);
  if (!Number.isNaN(parsedPort)) {
    /* parsedPort is a valid int. Bind to TCP. */
    port = parsedPort;
  } else {
    /* parsedPort is not a valid int. Bind to socket given by environment. */
    port = process.env.PORT;
  }
}

const server = http.createServer(app);
server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
