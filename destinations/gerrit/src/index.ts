import { Command } from 'commander';

import { FarosDestinationRunner } from 'airbyte-faros-destination';
import { Events } from './gerrit-events';

// Main entry point
export function mainCommand(): Command {
  const destinationRunner = new FarosDestinationRunner();

  // Register your custom converter(s)
  destinationRunner.registerConverters(new Events());

  return destinationRunner.program;
}
