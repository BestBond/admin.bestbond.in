type Props = {
  label?: string;
  placeholder?: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  touched?: boolean;
}

const InputField = ({ label, placeholder, type = "text", name, value, onChange, onBlur, error, touched, disabled }: Props & { onBlur?: (e: any) => void; disabled?: boolean }) => {
  const showError = error && touched;

  return (
    <div className="w-full group">
      <div className="flex justify-between items-center ml-1 mb-2">
        <label className={`text-[11px] font-bold tracking-[0.1em] uppercase transition-colors ${showError ? 'text-red-500' : 'text-text-secondary/60'}`}>
          {label}
        </label>
        {showError && (
          <div className="relative group/tooltip">
            <div className="cursor-help text-red-500 hover:text-red-600 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {/* Tooltip */}
            <div className="absolute right-0 bottom-full mb-2 px-3 py-1.5 bg-[#1E2633] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
              {error}
              <div className="absolute top-full right-2 border-4 border-transparent border-t-[#1E2633]"></div>
            </div>
          </div>
        )}
      </div>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={`w-full px-6 py-4 rounded-full border-[1.5px] outline-none transition-all duration-300 placeholder:text-text-muted/50 text-sm font-medium ${
          showError 
            ? "border-red-500 bg-red-50/10 text-red-900 focus:ring-4 focus:ring-red-500/5" 
            : "border-border/60 bg-white focus:border-brand-orange/40 focus:ring-4 focus:ring-brand-orange/5"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}`}
      />
    </div>
  );
};

export default InputField;