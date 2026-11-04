import { useNavigate } from "react-router-dom";

const AccessDeniedPage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="mb-4 text-2xl font-semibold">Access Denied</h1>
      <p className="mb-6 text-gray-700">You don’t have permission to access this page.</p>
      <button
        onClick={() => navigate("/dashboard")}
        className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default AccessDeniedPage;
