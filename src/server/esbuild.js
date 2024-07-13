const esbuild = require('esbuild');
const { config } = require('./esbuild.config');

esbuild.build(config).catch(() => process.exit(1));
