export const lessons = [
  'move', 'slash', 'skill', 'awakening', 'dash', 'iaijutsu',
  'dodge', 'parry', 'dash-slash', 'charge-dash', 'shop',
] as const;

export type Lesson = typeof lessons[number];
export type LessonState = Lesson | 'complete';

export interface TutorialSessionState {
  sessionId: number;
  lastSeq: number;
  currentLesson: LessonState;
  slashHits: number;
  recordedSlashAttackIds: number[];
  dashCount: number;
  dodgeSuccesses: number;
  parrySuccesses: number;
  shopPurchased: boolean;
  missCount: number;
  skippedLessons: Lesson[];
}

export function createTutorialSession(sessionId: number): TutorialSessionState {
  return {
    sessionId,
    lastSeq: 0,
    currentLesson: 'move',
    slashHits: 0,
    recordedSlashAttackIds: [],
    dashCount: 0,
    dodgeSuccesses: 0,
    parrySuccesses: 0,
    shopPurchased: false,
    missCount: 0,
    skippedLessons: [],
  };
}

export function isLessonComplete(session: TutorialSessionState): boolean {
  return session.currentLesson === 'complete';
}

export function nextLesson(current: LessonState, passed: Lesson): LessonState {
  if (current === 'complete' || current !== passed) return current;
  const idx = lessons.indexOf(current);
  return lessons[idx + 1] ?? 'complete';
}

export function processLessonEvent(
  session: TutorialSessionState,
  event: any
): { advanced: boolean; session: TutorialSessionState } {
  if (!session || session.currentLesson === 'complete') {
    return { advanced: false, session };
  }
  if (!event || event.sessionId !== session.sessionId || event.seq <= session.lastSeq) {
    return { advanced: false, session };
  }

  // Clone session state immutably
  const next = {
    ...session,
    lastSeq: event.seq,
    recordedSlashAttackIds: [...session.recordedSlashAttackIds],
    skippedLessons: [...session.skippedLessons],
  };

  let advanced = false;

  switch (next.currentLesson) {
    case 'move': {
      if (event.type === 'move' && (event.distMoved ?? 0) >= 100 && (event.distToMarker ?? 999) <= 24) {
        next.currentLesson = nextLesson(next.currentLesson, 'move');
        advanced = true;
      }
      break;
    }

    case 'slash': {
      if (event.type === 'slash' && event.hitDummy) {
        const attackId = event.attackId ?? Math.random();
        if (!next.recordedSlashAttackIds.includes(attackId)) {
          next.recordedSlashAttackIds.push(attackId);
          next.slashHits++;
          if (next.slashHits >= 3) {
            next.currentLesson = nextLesson(next.currentLesson, 'slash');
            advanced = true;
          }
        }
      }
      break;
    }

    case 'skill': {
      if (event.type === 'skill' && (event.activated || event.hitDummy || event.isSupport)) {
        next.currentLesson = nextLesson(next.currentLesson, 'skill');
        advanced = true;
      }
      break;
    }

    case 'awakening': {
      if (event.type === 'awakening' && event.manualInput) {
        next.currentLesson = nextLesson(next.currentLesson, 'awakening');
        advanced = true;
      }
      break;
    }

    case 'dash': {
      if (event.type === 'dash' && (event.dashDist ?? 0) >= 50) {
        next.dashCount++;
        if (next.dashCount >= 2) {
          next.currentLesson = nextLesson(next.currentLesson, 'dash');
          advanced = true;
        }
      }
      break;
    }

    case 'iaijutsu': {
      if (event.type === 'iaijutsu' && (event.fullyCharged || (event.chargeScale ?? 0) >= 0.9) && event.hitDummy) {
        next.currentLesson = nextLesson(next.currentLesson, 'iaijutsu');
        advanced = true;
      }
      break;
    }

    case 'dodge': {
      if (event.type === 'dodge' && event.perfectDodge && event.fromDummy) {
        next.dodgeSuccesses++;
        if (next.dodgeSuccesses >= 2) {
          next.currentLesson = nextLesson(next.currentLesson, 'dodge');
          advanced = true;
        }
      }
      break;
    }

    case 'parry': {
      if (event.type === 'parry' && event.perfectParry && event.fromDummy) {
        next.parrySuccesses++;
        if (next.parrySuccesses >= 2) {
          next.currentLesson = nextLesson(next.currentLesson, 'parry');
          advanced = true;
        }
      }
      break;
    }

    case 'dash-slash': {
      if (event.type === 'dash-slash' && event.hitDummy && (event.timeSinceDashMs ?? 9999) <= 600) {
        next.currentLesson = nextLesson(next.currentLesson, 'dash-slash');
        advanced = true;
      }
      break;
    }

    case 'charge-dash': {
      if (event.type === 'charge-dash' && (event.fromChargeDash || (event.previousCharge ?? 0) >= 0.85) && event.hitDummy) {
        next.currentLesson = nextLesson(next.currentLesson, 'charge-dash');
        advanced = true;
      }
      break;
    }

    case 'shop': {
      if (event.type === 'shop') {
        if (event.phase === 'buy') {
          next.shopPurchased = true;
        } else if (event.phase === 'attack' && next.shopPurchased && event.hitDummy) {
          next.currentLesson = nextLesson(next.currentLesson, 'shop');
          advanced = true;
        }
      }
      break;
    }
  }

  return { advanced, session: next };
}
