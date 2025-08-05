import { Command } from 'commander';

import { FarosDestinationRunner } from 'airbyte-faros-destination';
import { GerritEvents } from './gerrit-events';

// Main entry point
export function mainCommand(): Command {
  const destinationRunner = new FarosDestinationRunner();

  // Register your custom converter(s)
  destinationRunner.registerConverters(new GerritEvents());

  return destinationRunner.program;
}
