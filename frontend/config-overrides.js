const path = require('path');

module.exports = function override(config, env) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    stream: require.resolve('stream-browserify'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    zlib: require.resolve('browserify-zlib'),
  };

  // Ignore source map warnings for missing source files
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /source-map-loader/,
  ];

  // Optional: disable source maps in development to avoid warnings
  if (env === 'development') {
    config.module.rules = config.module.rules.map(rule => {
      if (rule.oneOf) {
        rule.oneOf = rule.oneOf.map(oneOfRule => {
          if (oneOfRule.loader && oneOfRule.loader.includes('source-map-loader')) {
            return { ...oneOfRule, exclude: /node_modules/ };
          }
          return oneOfRule;
        });
      }
      return rule;
    });
  }

  return config;
};
