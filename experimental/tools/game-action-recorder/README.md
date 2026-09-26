# Game Action Recorder

Experimental CLI and library for recording timed arcade match actions and validating deterministic replays.

## Usage

```bash
npm install
npm run build
game-action-recorder validate ./session.json
game-action-recorder validate ./session.json --json
```

## API

- `ActionRecorder` — append actions with relative millisecond timestamps and export a `MatchReplaySession`.
- `validateReplaySession(session, gameRulesEngine)` — replay actions and verify outcome / chain integrity.

## Tests

```bash
npm test
```
