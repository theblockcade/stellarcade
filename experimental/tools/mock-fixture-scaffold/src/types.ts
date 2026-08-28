export type FixtureTemplate = 'single-player' | 'multi-player' | 'staking';

export interface ScaffoldOptions {
  contract: string;
  template: FixtureTemplate;
  dest: string;
  force: boolean;
}

export interface ParsedCliArgs {
  contract: string;
  template: FixtureTemplate;
  dest: string;
  force: boolean;
}
