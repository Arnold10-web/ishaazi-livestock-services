/**
 * NewsletterForm Accessibility Tests
 * 
 * Dedicated accessibility tests for the NewsletterForm component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { 
  testAccessibility, 
  testKeyboardNavigation, 
  testAriaAttributes,
  testSemanticStructure,
  runAccessibilityTestSuite
} from '../../test-utils/accessibility';

// Mock NewsletterForm component for testing
const MockNewsletterForm = ({ onSubmit, isLoading, showSuccess, showError }) => {
  const [email, setEmail] = React.useState('');
  const [subscriptionType, setSubscriptionType] = React.useState('all');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit({ email, subscriptionType });
  };

  return (
    <form onSubmit={handleSubmit} role="form" aria-label="Newsletter subscription">
      <fieldset>
        <legend>Subscribe to our newsletter</legend>
        
        <div className="form-group">
          <label htmlFor="email-input">
            Email Address
            <span aria-label="required" className="required">*</span>
          </label>
          <input
            id="email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-describedby="email-help email-error"
            aria-invalid={showError ? 'true' : 'false'}
          />
          <div id="email-help" className="help-text">
            We'll never share your email with anyone else.
          </div>
          {showError && (
            <div id="email-error" role="alert" className="error-message">
              Please enter a valid email address.
            </div>
          )}
        </div>

        <div className="form-group">
          <fieldset>
            <legend>Subscription preferences</legend>
            <div role="radiogroup" aria-labelledby="subscription-legend">
              <label>
                <input
                  type="radio"
                  name="subscription"
                  value="all"
                  checked={subscriptionType === 'all'}
                  onChange={(e) => setSubscriptionType(e.target.value)}
                />
                All content
              </label>
              <label>
                <input
                  type="radio"
                  name="subscription"
                  value="weekly"
                  checked={subscriptionType === 'weekly'}
                  onChange={(e) => setSubscriptionType(e.target.value)}
                />
                Weekly digest
              </label>
              <label>
                <input
                  type="radio"
                  name="subscription"
                  value="monthly"
                  checked={subscriptionType === 'monthly'}
                  onChange={(e) => setSubscriptionType(e.target.value)}
                />
                Monthly newsletter
              </label>
            </div>
          </fieldset>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          aria-describedby={isLoading ? 'loading-message' : undefined}
        >
          {isLoading ? 'Subscribing...' : 'Subscribe'}
        </button>

        {isLoading && (
          <div id="loading-message" aria-live="polite" className="sr-only">
            Processing your subscription request
          </div>
        )}

        {showSuccess && (
          <div role="status" aria-live="polite" className="success-message">
            Successfully subscribed to our newsletter!
          </div>
        )}
      </fieldset>
    </form>
  );
};

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

// Helper function to render NewsletterForm with wrapper
const renderNewsletterForm = (props = {}) => {
  return render(
    <TestWrapper>
      <MockNewsletterForm {...props} />
    </TestWrapper>
  );
};

describe('NewsletterForm Accessibility Tests', () => {
  describe('Basic Accessibility Compliance', () => {
    it('passes automated accessibility tests', async () => {
      const { container } = renderNewsletterForm();
      await testAccessibility(container);
    });

    it('passes accessibility tests in all states', async () => {
      const states = [
        { props: { isLoading: true }, name: 'loading' },
        { props: { showSuccess: true }, name: 'success' },
        { props: { showError: true }, name: 'error' },
      ];

      for (const state of states) {
        const { container } = renderNewsletterForm(state.props);
        await testAccessibility(container);
      }
    });
  });

  describe('Semantic Structure', () => {
    it('has proper semantic HTML structure', () => {
      const { container } = renderNewsletterForm();
      
      testSemanticStructure(container, {
        hasFormElements: true,
      });

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByText('Subscribe to our newsletter')).toBeInTheDocument();
    });

    it('uses fieldset and legend correctly', () => {
      renderNewsletterForm();
      
      const mainFieldset = screen.getByRole('group', { name: 'Subscribe to our newsletter' });
      expect(mainFieldset).toBeInTheDocument();
      
      const preferencesFieldset = screen.getByRole('group', { name: 'Subscription preferences' });
      expect(preferencesFieldset).toBeInTheDocument();
    });

    it('has proper radio group structure', () => {
      renderNewsletterForm();
      
      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();
      
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(3);
      
      radioButtons.forEach(radio => {
        expect(radio).toHaveAttribute('name', 'subscription');
      });
    });
  });

  describe('ARIA Attributes', () => {
    it('has proper ARIA labels and descriptions', () => {
      renderNewsletterForm();
      
      const form = screen.getByRole('form');
      testAriaAttributes(form, {
        'aria-label': 'Newsletter subscription',
      });

      const emailInput = screen.getByLabelText(/email address/i);
      testAriaAttributes(emailInput, {
        'aria-describedby': 'email-help email-error',
        'aria-invalid': 'false',
      });
    });

    it('updates ARIA attributes in error state', () => {
      renderNewsletterForm({ showError: true });
      
      const emailInput = screen.getByLabelText(/email address/i);
      testAriaAttributes(emailInput, {
        'aria-invalid': 'true',
        'aria-describedby': 'email-help email-error',
      });
    });

    it('has proper live regions for dynamic content', () => {
      renderNewsletterForm({ isLoading: true });
      
      const loadingMessage = screen.getByText('Processing your subscription request');
      testAriaAttributes(loadingMessage, {
        'aria-live': 'polite',
      });
    });

    it('has proper alert roles for errors', () => {
      renderNewsletterForm({ showError: true });
      
      const errorMessage = screen.getByText('Please enter a valid email address.');
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports full keyboard navigation', async () => {
      const { container } = renderNewsletterForm();
      
      await testKeyboardNavigation(container, [
        'input[type="email"]',
        'input[type="radio"][value="all"]',
        'button[type="submit"]',
      ]);
    });

    it('maintains logical tab order', async () => {
      const user = userEvent.setup();
      renderNewsletterForm();
      
      const emailInput = screen.getByLabelText(/email address/i);
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);
      
      await user.tab();
      const firstRadio = screen.getByDisplayValue('all');
      expect(document.activeElement).toBe(firstRadio);
      
      await user.tab();
      const submitButton = screen.getByRole('button', { name: /subscribe/i });
      expect(document.activeElement).toBe(submitButton);
    });

    it('handles form submission with keyboard', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();
      renderNewsletterForm({ onSubmit: mockSubmit });
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /subscribe/i });
      submitButton.focus();
      await user.keyboard('{Enter}');
      
      expect(mockSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        subscriptionType: 'all',
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('provides proper labels for all form controls', () => {
      renderNewsletterForm();
      
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText('All content')).toBeInTheDocument();
      expect(screen.getByLabelText('Weekly digest')).toBeInTheDocument();
      expect(screen.getByLabelText('Monthly newsletter')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
    });

    it('provides helpful descriptions and instructions', () => {
      renderNewsletterForm();
      
      const helpText = screen.getByText("We'll never share your email with anyone else.");
      expect(helpText).toHaveAttribute('id', 'email-help');
      
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('aria-describedby', expect.stringContaining('email-help'));
    });

    it('announces dynamic content changes', () => {
      renderNewsletterForm({ showSuccess: true });
      
      const successMessage = screen.getByText('Successfully subscribed to our newsletter!');
      expect(successMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Form Validation Accessibility', () => {
    it('associates error messages with form controls', () => {
      renderNewsletterForm({ showError: true });
      
      const emailInput = screen.getByLabelText(/email address/i);
      const errorMessage = screen.getByText('Please enter a valid email address.');
      
      expect(errorMessage).toHaveAttribute('id', 'email-error');
      expect(emailInput).toHaveAttribute('aria-describedby', expect.stringContaining('email-error'));
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('indicates required fields appropriately', () => {
      renderNewsletterForm();
      
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('required');
      
      expect(screen.getByLabelText('required')).toBeInTheDocument();
    });
  });

  describe('Comprehensive Accessibility Test Suite', () => {
    it('passes complete accessibility test suite', async () => {
      await runAccessibilityTestSuite(
        () => renderNewsletterForm(),
        {
          semanticRequirements: {
            hasFormElements: true,
            hasProperLabels: true,
          },
          keyboardTestSelectors: [
            'input[type="email"]',
            'input[type="radio"]',
            'button[type="submit"]',
          ],
        }
      );
    });
  });
});