import { createContext, useContext } from 'react';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Provides the heading level that the next ContentShell should render at. */
export const HeadingLevelContext = createContext<HeadingLevel>(1);

/**
 * Returns the heading level that the current ContentShell context expects.
 * Use this inside custom components that need to render a heading at the
 * appropriate depth without coupling to a fixed h* tag.
 */
export function useHeadingLevel(): HeadingLevel {
  return useContext(HeadingLevelContext);
}
