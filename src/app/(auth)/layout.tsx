interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="h-screen flex flex-col justify-center items-center">
      <h1 className="text-center text-2xl text-brandPrimary font-bold">
        Restaurant Campomar
      </h1>
      <div className="bg-slate-100 p-10 mx-4 my-6 rounded-md">{children}</div>
    </div>
  );
};

export default AuthLayout;
