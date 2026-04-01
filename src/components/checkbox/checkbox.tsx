import { useCallback, useRef } from 'react';
import React from 'react';
import cx from 'classnames';

import Button from 'components/button';

export type CheckboxProps = {
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean, e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  type?: string;
  disabled?: boolean;
} & Omit<React.HTMLAttributes<HTMLInputElement>, 'onChange'>;

const Checkbox: React.FC<CheckboxProps> = ({ defaultChecked, checked, onChange, className, children, disabled, ...props }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      onChange?.(e.target.checked, e);
    },
    [onChange],
  );
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      props.onClick?.(e as any);
      inputRef.current?.click();
    },
    [props.onClick],
  );

  return (
    <Button
      className={cx('p-1 flex items-center !rounded-md h-8', children ? 'justify-start' : 'w-8 justify-center', className)}
      onClick={handleClick}
      disabled={disabled}
    >
      <input
        type="checkbox"
        {...props}
        ref={inputRef}
        className="cursor-pointer w-6 h-6"
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      {children && <span className="inline-block ml-2 whitespace-nowrap">{children}</span>}
    </Button>
  );
};

export default Checkbox;
