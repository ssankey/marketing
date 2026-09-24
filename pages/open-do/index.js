// pages/open-do/index.js
import { useAuth } from "hooks/useAuth";
import OpenDOTable from "components/openDO/OpenDOTable";

export default function OpenDOPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <OpenDOTable
      initialStatus="open"
      initialPage={1}
      pageSize={20}
    />
  );
}

OpenDOPage.seo = {
  title: "Open DO | Density",
  description: "View and manage all your open delivery orders.",
  keywords: "delivery orders, DO, dispatch, density",
};
