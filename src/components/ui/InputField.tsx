// components/ui/InputField.jsx

type Props = {
  label?: string;
  placeholder?: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField = ({ label, placeholder, type = "text", name, value, onChange }: Props) => {
  return (
    <div className="">
      <label className="text-[12px] font-semibold text-text-secondary tracking-wider uppercase ml-1 mb-3">
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-5 py-3.5 rounded-full border-[1.5px] border-border outline-none focus:ring-1 focus:ring-brand-orange transition-all placeholder:text-text-muted text-sm mt-3"
      />
    </div>
  );
};

export default InputField;