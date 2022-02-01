const esbuild = require('esbuild');
const { devConfig } = require('./esbuild.config');

esbuild.build(devConfig).catch(() => process.exit(1));
