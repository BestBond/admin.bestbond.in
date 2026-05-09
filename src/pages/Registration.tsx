import { useState } from "react";
import RegistrationForm from "../components/auth/RegistrationForm";

const Registration = () => {
  const [isPending, setIsPending] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] py-12 px-4">
      <div className={`w-full ${isPending ? 'max-w-md' : 'max-w-2xl'} bg-white rounded-[48px] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 transition-all duration-500`}>
        <RegistrationForm onPending={() => setIsPending(true)} />
      </div>
    </div>
  );
};

export default Registration;
