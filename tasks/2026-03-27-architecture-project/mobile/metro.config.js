const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, '../../../shared');

const config = getDefaultConfig(projectRoot);

// Allow Metro to resolve the shared package outside this app's directory
config.watchFolders = [sharedRoot];
config.resolver.extraNodeModules = {
  '@coding-tasks/shared': sharedRoot,
};

module.exports = config;
