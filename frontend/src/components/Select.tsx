import { ChangeEvent } from 'react';

interface SelectProps<T> {
  options: T[];
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Select<T>({
  options,
  getLabel,
  getValue,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
  id,
}: SelectProps<T>) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <select
      id={id}
      className={`form-select ${className}`}
      value={value}
      onChange={handleChange}
      disabled={disabled}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => {
        const val = getValue(option);
        const label = getLabel(option);
        return (
          <option key={val} value={val}>
            {label}
          </option>
        );
      })}
    </select>
  );
}
