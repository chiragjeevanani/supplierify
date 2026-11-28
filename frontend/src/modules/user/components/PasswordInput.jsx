import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Must match PASSWORD_MIN in backend/src/validations/userAuthValidation.js
export const PASSWORD_MIN = 8;

/** Password field with a show / hide button. `onChange` receives the text. */
export default function PasswordInput({ value, onChange, className = '', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={72}
        className={`${className} !pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 px-3.5 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
