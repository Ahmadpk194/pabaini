export enum SeriesStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
}

export enum MatchScoringMode {
  SIMPLE = 'simple',
  LIVE = 'live',
}

export enum MatchStatus {
  PENDING_REQUEST = 'pending_request',
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_RESULT = 'no_result',
}

export enum HowOut {
  BOWLED = 'bowled',
  CAUGHT = 'caught',
  RUN_OUT = 'run_out',
  LBW = 'lbw',
  STUMPED = 'stumped',
  HIT_WICKET = 'hit_wicket',
  RETIRED_HURT = 'retired_hurt',
  RETIRED_OUT = 'retired_out',
}

export enum BallExtraType {
  WIDE = 'wide',
  NO_BALL = 'no_ball',
  BYE = 'bye',
  LEG_BYE = 'leg_bye',
}
