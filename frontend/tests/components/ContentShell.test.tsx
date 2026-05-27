/**
 * @vitest-environment happy-dom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { ContentShell } from '@/components/v1/ContentShell';
import { HeadingLevelContext, useHeadingLevel } from '@/hooks/v1/useHeadingLevel';

// ── helper: render a ContentShell at a specific context depth ──────────────
function renderAtLevel(level: 1 | 2 | 3 | 4 | 5 | 6, title: string) {
  return render(
    <HeadingLevelContext.Provider value={level}>
      <ContentShell title={title} testId="shell" />
    </HeadingLevelContext.Provider>,
  );
}

describe('ContentShell — heading level derivation', () => {
  it('renders an h1 when context level is 1 (default)', () => {
    render(<ContentShell title="Page Title" testId="shell" />);

    const heading = screen.getByTestId('shell-title');
    expect(heading.tagName).toBe('H1');
    expect(heading).toHaveAttribute('data-heading-level', '1');
    expect(heading).toHaveTextContent('Page Title');
  });

  it('renders an h2 when context level is 2', () => {
    renderAtLevel(2, 'Section Title');

    const heading = screen.getByTestId('shell-title');
    expect(heading.tagName).toBe('H2');
    expect(heading).toHaveAttribute('data-heading-level', '2');
  });

  it('renders an h3 when context level is 3', () => {
    renderAtLevel(3, 'Sub-section');

    expect(screen.getByTestId('shell-title').tagName).toBe('H3');
  });

  it('renders h6 at the maximum nesting depth', () => {
    renderAtLevel(6, 'Deep Section');

    expect(screen.getByTestId('shell-title').tagName).toBe('H6');
  });

  it('headingLevel prop overrides context depth', () => {
    render(
      <HeadingLevelContext.Provider value={2}>
        <ContentShell title="Forced h4" headingLevel={4} testId="shell" />
      </HeadingLevelContext.Provider>,
    );

    expect(screen.getByTestId('shell-title').tagName).toBe('H4');
  });
});

describe('ContentShell — heading hierarchy in nested shells', () => {
  it('provides the next heading level to children via context', () => {
    const ChildChecker: React.FC = () => {
      const level = useHeadingLevel();
      return <span data-testid="child-level">{level}</span>;
    };

    render(
      <ContentShell title="Outer" testId="outer">
        <ChildChecker />
      </ContentShell>,
    );

    // outer renders h1, so children should receive level 2
    expect(screen.getByTestId('child-level')).toHaveTextContent('2');
  });

  it('outer h1 → inner h2 → innermost h3 in three-level nesting', () => {
    render(
      <ContentShell title="Level 1" testId="l1">
        <ContentShell title="Level 2" testId="l2">
          <ContentShell title="Level 3" testId="l3" />
        </ContentShell>
      </ContentShell>,
    );

    expect(screen.getByTestId('l1-title').tagName).toBe('H1');
    expect(screen.getByTestId('l2-title').tagName).toBe('H2');
    expect(screen.getByTestId('l3-title').tagName).toBe('H3');
  });

  it('sibling shells at the same context level both render the same tag', () => {
    render(
      <HeadingLevelContext.Provider value={2}>
        <ContentShell title="First" testId="first" />
        <ContentShell title="Second" testId="second" />
      </HeadingLevelContext.Provider>,
    );

    expect(screen.getByTestId('first-title').tagName).toBe('H2');
    expect(screen.getByTestId('second-title').tagName).toBe('H2');
  });
});

describe('ContentShell — rendering slots', () => {
  it('renders description when provided', () => {
    render(
      <ContentShell title="Title" description="Supporting copy" testId="shell" />,
    );

    expect(screen.getByTestId('shell-description')).toHaveTextContent('Supporting copy');
  });

  it('does not render description element when omitted', () => {
    render(<ContentShell title="No desc" testId="shell" />);

    expect(screen.queryByTestId('shell-description')).not.toBeInTheDocument();
  });

  it('renders actions slot in header', () => {
    render(
      <ContentShell
        title="With actions"
        actions={<button type="button">Save</button>}
        testId="shell"
      />,
    );

    expect(screen.getByTestId('shell-actions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('renders children in the body region', () => {
    render(
      <ContentShell title="Parent" testId="shell">
        <p>Child content</p>
      </ContentShell>,
    );

    expect(screen.getByTestId('shell-body')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('does not render body element when children are absent', () => {
    render(<ContentShell title="No children" testId="shell" />);

    expect(screen.queryByTestId('shell-body')).not.toBeInTheDocument();
  });

  it('forwards titleId to the heading element', () => {
    render(
      <ContentShell title="Labelled" titleId="my-section-id" testId="shell" />,
    );

    expect(screen.getByTestId('shell-title')).toHaveAttribute('id', 'my-section-id');
  });
});

describe('ContentShell — dev warning for overly deep nesting', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fires a console.warn when context depth would exceed 6 without an override', () => {
    render(
      <HeadingLevelContext.Provider value={7 as any}>
        <ContentShell title="Too deep" testId="shell" />
      </HeadingLevelContext.Provider>,
    );

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Heading level would exceed h6'),
    );
  });

  it('does not warn when headingLevel override is provided', () => {
    render(
      <HeadingLevelContext.Provider value={7 as any}>
        <ContentShell title="Overridden" headingLevel={6} testId="shell" />
      </HeadingLevelContext.Provider>,
    );

    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe('ContentShell — accessibility', () => {
  it('heading is accessible via its text content', () => {
    render(<ContentShell title="Accessible Heading" testId="shell" />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Accessible Heading' }),
    ).toBeInTheDocument();
  });

  it('aria-labelledby pattern works via titleId', () => {
    render(
      <section aria-labelledby="region-label">
        <ContentShell title="Region" titleId="region-label" testId="shell" />
      </section>,
    );

    const section = screen
      .getByTestId('shell-title')
      .closest('section')!;
    expect(section).toHaveAttribute('aria-labelledby', 'region-label');
    expect(screen.getByTestId('shell-title')).toHaveAttribute('id', 'region-label');
  });
});

describe('useHeadingLevel — context hook', () => {
  it('returns 1 when no provider is present (default)', () => {
    const Probe: React.FC = () => {
      const level = useHeadingLevel();
      return <span data-testid="level">{level}</span>;
    };

    render(<Probe />);
    expect(screen.getByTestId('level')).toHaveTextContent('1');
  });

  it('returns the value supplied by HeadingLevelContext.Provider', () => {
    const Probe: React.FC = () => {
      const level = useHeadingLevel();
      return <span data-testid="level">{level}</span>;
    };

    render(
      <HeadingLevelContext.Provider value={4}>
        <Probe />
      </HeadingLevelContext.Provider>,
    );

    expect(screen.getByTestId('level')).toHaveTextContent('4');
  });
});
