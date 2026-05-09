
import AuthForm from "../components/auth/AuthForm";

const SignUp = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-offwhite py-12">
      <div className="w-full md:max-w-5xl mx-auto">
        <AuthForm />
      </div>
    </div>
  );
};

export default SignUp;