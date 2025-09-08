import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <div className="text-center px-6">
        <div className="relative">
          <h1 className="text-7xl md:text-8xl font-light text-neutral-300 tracking-tight leading-none select-none mb-4">
            404
          </h1>
          <p className="text-neutral-500 text-lg font-medium mb-8">
            Page not found
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center text-neutral-600 hover:text-neutral-800 transition-colors duration-200 text-sm font-medium tracking-wide uppercase border-b border-neutral-200 hover:border-neutral-400 pb-1"
          >
            ← Back home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
