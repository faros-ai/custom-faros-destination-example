import { Command } from "commander";

import { FarosDestinationRunner } from "airbyte-faros-destination";
import { Gerrit } from "./gerrit";

// Main entry point
export function mainCommand(): Command {
  const destinationRunner = new FarosDestinationRunner();

  // Register your custom converter(s)
  destinationRunner.registerConverters(new Gerrit());

  return destinationRunner.program;
}
