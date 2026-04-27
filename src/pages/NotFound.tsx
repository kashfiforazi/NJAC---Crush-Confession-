import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-32 text-center space-y-6">
      <h1 className="text-6xl font-heading font-extrabold text-primary-500">404</h1>
      <h2 className="text-2xl font-bold">Page Not Found</h2>
      <p className="text-slate-500 max-w-md mx-auto">It seems the confession you are looking for has vanished into thin air.</p>
      <Link to="/" className="inline-block px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg font-medium">
        Go Back Home
      </Link>
    </div>
  );
}
