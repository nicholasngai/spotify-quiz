const path = require('path');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

const config = {
  platform: 'node',
  entryPoints: [path.resolve(__dirname, '../build/server/bin/www.js')],
  outfile: path.resolve(__dirname, '../build/dist/server.js'),
  bundle: true,
  minify: true,
  plugins: [
    nodeExternalsPlugin(),
  ],
  logLevel: 'info',
};

module.exports = {
  config,
};
