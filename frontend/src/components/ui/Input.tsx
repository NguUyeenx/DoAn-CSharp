import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className, id: externalId, ...rest }, ref) => {
    const autoId = useId();
    const id = externalId ?? autoId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            aria-invalid={hasError || undefined}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              'w-full rounded-[10px] border bg-surface px-3 py-2.5',
              'text-text-primary placeholder:text-text-muted',
              'transition-colors duration-150 ease-[var(--ease-out-quart)]',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              icon && 'pl-10',
              hasError
                ? 'border-danger focus:ring-danger/30'
                : 'border-border hover:border-border-hover focus:ring-primary/30 focus:border-primary',
              'dark:bg-surface-alt',
              className,
            )}
            {...rest}
          />
        </div>

        {hasError && (
          <p id={errorId} className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {!hasError && helperText && (
          <p id={helperId} className="text-sm text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
