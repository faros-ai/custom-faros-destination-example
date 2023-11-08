# Airbyte Connectors

Example Custom Airbyte connectors

# Development

1. Install [`nvm`](https://github.com/nvm-sh/nvm#installing-and-updating)
2. Install Node.js `nvm install 16 && nvm use 16`
3. Install `lerna` by running `npm install -g lerna`
4. Run `npm i` to install dependencies for all projects (`npm run clean` to clean all)
5. Run `npm run build` to build all projects (for a single project add scope, e.g `npm run build -- --scope example-destination`)
6. Run `npm run test` to test all projects (for a single project add scope, e.g `npm run test -- --scope example-destination`)
7. Run `npm run lint` to apply linter on all projects (for a single project add scope, e.g `npm run lint -- --scope example-destination`)

👉 Follow our guide on how to develop a new source [here](https://github.com/faros-ai/airbyte-connectors/tree/main/sources#developing-an-airbyte-source).

## Other Useful Commands

1. Audit fix `npm audit fix`
2. Clean your project `npm run clean`

Read more about `lerna` [here](https://github.com/lerna/lerna).

# Build Docker Images

In order to build a Docker image for a connector run the `docker build` command and set `path` and `version` arguments.
For example for Faros Destination connector run:

```sh
docker build . --build-arg path=destinations/example-destination --build-arg version=0.1.0 -t example-destination
```

