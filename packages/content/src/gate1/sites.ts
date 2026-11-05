// Gate 1 sites (D-227). The sample fight is S1's one room. The Hollow Barrow is S2's whole delve:
// an entry, 5 fight rooms and 3 choice rooms to draw from, and the warden's room (spec "Rooms";
// room names and lines are D-232's words in gate1.en.json). Every fight room has an archer, a
// foe that reaches the back (D-218). The mill cellar and the drowned chapel arrive in S3.
import type { FightRoom, RoomFoe, Site } from '@adventure-manager/engine';

const hound: RoomFoe = { kindId: 'foe.hound', row: 'front' };
const archer: RoomFoe = { kindId: 'foe.barrow-archer', row: 'back' };
const room = (id: string, foes: readonly RoomFoe[]): FightRoom => ({ id, foes });

export const gate1Sites: Readonly<Record<string, Site>> = {
  'site.sample-fight': {
    id: 'site.sample-fight',
    danger: 'hazardous',
    fightRooms: [room('room.sample-fight', [hound, hound, hound, archer])],
  },
  'site.hollow-barrow': {
    id: 'site.hollow-barrow',
    danger: 'hazardous',
    entry: {
      id: 'room.barrow-mouth',
      options: [
        { attribute: 'approach', onFailure: 'hurt' },
        { attribute: 'lore', onFailure: 'alert' },
      ],
    },
    fightRooms: [
      room('room.hound-run', [hound, hound, hound, archer]),
      room('room.bone-niches', [hound, hound, archer, archer]),
      room('room.long-gallery', [hound, archer, archer]),
      room('room.kennel-pit', [hound, hound, hound, hound, archer]),
      room('room.watchers-ledge', [hound, hound, archer, archer, archer]),
    ],
    choiceRooms: [
      {
        id: 'room.fallen-passage',
        options: [
          { attribute: 'agility', onFailure: 'hurt' },
          { attribute: 'wits', onFailure: 'alert' },
        ],
      },
      {
        id: 'room.sunken-floor',
        options: [
          { attribute: 'might', onFailure: 'hurt' },
          { attribute: 'stealth', onFailure: 'alert' },
        ],
      },
      {
        id: 'room.sealed-door',
        options: [
          { attribute: 'lore', onFailure: 'hurt' },
          { attribute: 'presence', onFailure: 'alert' },
        ],
      },
    ],
    boss: room('room.burial-hall', [
      { kindId: 'foe.restless-warden', row: 'front' },
      hound,
      archer,
    ]),
  },
};
