import { createConfig } from 'fuels';

export default createConfig({
  contracts: [
        '..',
        // 'node_modules/toml/test',
  ],
  output: './src/sway-api',
});

/**
 * Check the docs:
 * https://docs.fuel.network/docs/fuels-ts/fuels-cli/config-file/
 */
