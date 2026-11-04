import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="w-full min-h-screen bg-[#060403]">
      <Outlet />
    </div>
  );
};

export default AuthLayout;