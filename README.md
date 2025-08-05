# Custom Faros Destination Example

This repository contains an example of a custom Airbyte Faros destination allowing writing data into Faros from any custom source.
Please refer to the [documentation](https://github.com/faros-ai/airbyte-connectors/tree/main/destinations/airbyte-faros-destination#custom-sources) for more information about this feature.

## Development

1. Install [`nvm`](https://github.com/nvm-sh/nvm#installing-and-updating)
2. Install Node.js `nvm install 22 && nvm use 22`
3. Install [`Turborepo`](https://turbo.build/repo) by running `npm install turbo --global`
4. Run `npm i` to install dependencies for all projects (`npm run clean` to clean all)
5. Run `turbo build` to build all projects (for a single project add scope, e.g `turbo build --filter=example-destination`)
6. Run `turbo test` to test all projects (for a single project add scope, e.g `turbo test --filter=example-destination`)
7. Run `turbo lint` to apply linter on all projects (for a single project add scope, e.g `turbo lint --filter=example-destination`)


## Other Useful Commands

1. Audit fix `npm audit fix`
2. Clean your project `npm run clean`

Read more about `Turborepo` [here](https://turbo.build/repo).

# Build Docker Images

To build a Docker image for a destination, run the `docker build` command and set `path` and `version` arguments.

For example, for the `example-destination` run:

```sh
docker build . --build-arg path=destinations/example-destination --build-arg version=0.1.0 -t example-destination
```

