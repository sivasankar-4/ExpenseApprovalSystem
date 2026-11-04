import { useEffect, type ReactNode } from "react";
import { refreshAccessToken } from "@/services/api/axios";
import { clearAuthSession } from "@/services/auth/authSession";

let initializationStarted = false;

type Props = {
  children: ReactNode;
};

const AuthSessionProvider = ({ children }: Props) => {
  useEffect(() => {
    if (initializationStarted) {
      return;
    }

    initializationStarted = true;
    void refreshAccessToken().catch(() => {
      clearAuthSession();
    });
  }, []);

  return children;
};

export default AuthSessionProvider;
