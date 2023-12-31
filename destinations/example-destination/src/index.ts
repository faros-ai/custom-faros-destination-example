import { Command } from 'commander';

import { FarosDestinationRunner } from 'airbyte-faros-destination';
import { Tasks } from './tasks';

// Main entry point
export function mainCommand(): Command {
  const destinationRunner = new FarosDestinationRunner();

  // Register your custom converter(s)
  destinationRunner.registerConverters(new Tasks());

  return destinationRunner.program;
}
