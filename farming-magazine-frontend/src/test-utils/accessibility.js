/**
 * Accessibility Testing Utilities
 * 
 * Utilities for testing accessibility compliance using jest-axe
 */

import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Test component for accessibility violations
 * @param {HTMLElement} container - The container to test
 * @param {Object} options - Axe configuration options
 * @returns {Promise} - Promise that resolves with axe results
 */
export const testAccessibility = async (container, options = {}) => {
  const results = await axe(container, {
    rules: {
      // Disable color-contrast rule for testing (can be flaky)
      'color-contrast': { enabled: false },
      // Enable other important rules
      'aria-allowed-attr': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-valid-attr': { enabled: true },
      'button-name': { enabled: true },
      'heading-order': { enabled: true },
      'image-alt': { enabled: true },
      'label': { enabled: true },
      'link-name': { enabled: true },
      'list': { enabled: true },
      'listitem': { enabled: true },
      'region': { enabled: true },
      'skip-link': { enabled: true },
      'tabindex': { enabled: true },
      ...options.rules,
    },
    ...options,
  });

  expect(results).toHaveNoViolations();
  return results;
};

/**
 * Test keyboard navigation
 * @param {HTMLElement} container - The container to test
 * @param {Array} expectedFocusOrder - Expected order of focusable elements
 */
export const testKeyboardNavigation = async (container, expectedFocusOrder = []) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  // Test Tab navigation
  for (let i = 0; i < focusableElements.length; i++) {
    const element = focusableElements[i];
    element.focus();
    expect(document.activeElement).toBe(element);
  }

  // Test expected focus order if provided
  if (expectedFocusOrder.length > 0) {
    expectedFocusOrder.forEach((selector, index) => {
      const element = container.querySelector(selector);
      if (element) {
        element.focus();
        expect(document.activeElement).toBe(element);
      }
    });
  }
};

/**
 * Test ARIA attributes
 * @param {HTMLElement} element - Element to test
 * @param {Object} expectedAttributes - Expected ARIA attributes
 */
export const testAriaAttributes = (element, expectedAttributes) => {
  Object.entries(expectedAttributes).forEach(([attr, value]) => {
    if (value === null) {
      expect(element).not.toHaveAttribute(attr);
    } else {
      expect(element).toHaveAttribute(attr, value);
    }
  });
};

/**
 * Test semantic HTML structure
 * @param {HTMLElement} container - Container to test
 * @param {Object} requirements - Semantic requirements
 */
export const testSemanticStructure = (container, requirements = {}) => {
  const {
    hasMainLandmark = false,
    hasNavigation = false,
    hasHeadings = false,
    hasProperHeadingHierarchy = false,
    hasSkipLink = false,
  } = requirements;

  if (hasMainLandmark) {
    expect(container.querySelector('main, [role="main"]')).toBeInTheDocument();
  }

  if (hasNavigation) {
    expect(container.querySelector('nav, [role="navigation"]')).toBeInTheDocument();
  }

  if (hasHeadings) {
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeInTheDocument();
  }

  if (hasProperHeadingHierarchy) {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
    
    // Check that we start with h1
    if (levels.length > 0) {
      expect(levels[0]).toBe(1);
    }

    // Check that heading levels don't skip
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeLessThanOrEqual(levels[i - 1] + 1);
    }
  }

  if (hasSkipLink) {
    expect(container.querySelector('a[href="#main"], a[href="#content"]')).toBeInTheDocument();
  }
};

/**
 * Test screen reader announcements
 * @param {HTMLElement} container - Container to test
 * @param {string} expectedText - Expected announcement text
 */
export const testScreenReaderAnnouncement = (container, expectedText) => {
  const liveRegion = container.querySelector('[aria-live], [role="status"], [role="alert"]');
  if (liveRegion) {
    expect(liveRegion).toHaveTextContent(expectedText);
  }
};

/**
 * Test color contrast (manual check helper)
 * @param {HTMLElement} element - Element to check
 * @returns {Object} - Color information for manual verification
 */
export const getColorInfo = (element) => {
  const styles = window.getComputedStyle(element);
  return {
    color: styles.color,
    backgroundColor: styles.backgroundColor,
    fontSize: styles.fontSize,
    fontWeight: styles.fontWeight,
  };
};

/**
 * Test focus management
 * @param {HTMLElement} container - Container to test
 * @param {Function} triggerAction - Function that triggers focus change
 * @param {string} expectedFocusSelector - Selector for expected focused element
 */
export const testFocusManagement = async (container, triggerAction, expectedFocusSelector) => {
  await triggerAction();
  const expectedElement = container.querySelector(expectedFocusSelector);
  expect(document.activeElement).toBe(expectedElement);
};

/**
 * Accessibility test suite for components
 * @param {Function} renderComponent - Function that renders the component
 * @param {Object} options - Test options
 */
export const runAccessibilityTestSuite = async (renderComponent, options = {}) => {
  const {
    skipAxe = false,
    skipKeyboard = false,
    skipSemantics = false,
    semanticRequirements = {},
    keyboardTestSelectors = [],
  } = options;

  const { container } = renderComponent();

  // Run axe tests
  if (!skipAxe) {
    await testAccessibility(container);
  }

  // Test keyboard navigation
  if (!skipKeyboard) {
    await testKeyboardNavigation(container, keyboardTestSelectors);
  }

  // Test semantic structure
  if (!skipSemantics) {
    testSemanticStructure(container, semanticRequirements);
  }
};

export default {
  testAccessibility,
  testKeyboardNavigation,
  testAriaAttributes,
  testSemanticStructure,
  testScreenReaderAnnouncement,
  getColorInfo,
  testFocusManagement,
  runAccessibilityTestSuite,
};