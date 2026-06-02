import React from 'react';
import { Link } from 'react-router-dom';

type LegalConsentCheckboxProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Extra sentence before the legal links (e.g. event-specific terms). */
  prefix?: string;
  className?: string;
};

export const LegalConsentCheckbox: React.FC<LegalConsentCheckboxProps> = ({
  id,
  checked,
  onChange,
  prefix,
  className = '',
}) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      required
      className="mt-1 h-4 w-4 shrink-0 rounded border-outline-variant/30 text-primary focus:ring-primary/30"
    />
    <label htmlFor={id} className="text-sm text-on-surface-variant leading-snug">
      {prefix ? <span>{prefix} </span> : null}
      I agree to the{' '}
      <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
        Terms of Use
      </Link>{' '}
      and{' '}
      <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
        Privacy Policy
      </Link>
      .
    </label>
  </div>
);
