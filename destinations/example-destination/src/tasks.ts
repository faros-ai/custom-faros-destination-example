import { AirbyteRecord } from 'faros-airbyte-cdk';
import {
  Converter,
  DestinationRecord,
  StreamContext,
} from 'airbyte-faros-destination';

interface Task {
  ID: string;
  Name: string;
  Description: string;
  CreatedAt: string;
  URL: string;
}

export class Tasks extends Converter {
  source = 'Sheets';

  destinationModels = [
    'tms_Task',
  ];

  id(record: AirbyteRecord): string {
    return record.record.data.id;
  }

  async convert(
    record: AirbyteRecord,
    ctx: StreamContext
  ): Promise<ReadonlyArray<DestinationRecord>> {
    const task = record.record.data as Task;

    return [
      {
        model: 'tms_Task',
        record: {
          uid: task.ID,
          name: task.Name,
          description: task.Description,
          createdAt: task.CreatedAt,
          url: task.URL,
        },
      }
    ];
  }
}
