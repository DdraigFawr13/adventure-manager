// Gate 1 sites (D-227). S1 holds only the sample fight: one room, 3 hounds in front and an archer
// behind that reaches the back row (D-218), no entry and no boss. The three sites arrive in S2–S3.
import type { Site } from '@adventure-manager/engine';

export const gate1Sites: Readonly<Record<string, Site>> = {
  'site.sample-fight': {
    id: 'site.sample-fight',
    danger: 'hazardous',
    fightRooms: [
      {
        id: 'room.sample-fight',
        foes: [
          { kindId: 'foe.hound', row: 'front' },
          { kindId: 'foe.hound', row: 'front' },
          { kindId: 'foe.hound', row: 'front' },
          { kindId: 'foe.barrow-archer', row: 'back' },
        ],
      },
    ],
  },
};
