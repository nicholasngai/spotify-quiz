const path = require('path');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

const config = {
  platform: 'node',
  entryPoints: [path.resolve(__dirname, 'bin/www.ts')],
  outfile: path.resolve(__dirname, '../../build/dist/server.js'),
  bundle: true,
  minify: true,
  plugins: [
    nodeExternalsPlugin(),
  ],
  logLevel: 'info',
};

const devConfig = {
  ...config,
  minify: false,
  watch: true,
};

module.exports = {
  config,
  devConfig,
};
