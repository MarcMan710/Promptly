import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-serif text-accent-600">✍️ Promptly</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/calendar" className="text-primary-600 hover:text-primary-900">Calendar</Link>
              <Link to="/stats" className="text-primary-600 hover:text-primary-900">Stats</Link>
              <Link to="/settings" className="text-primary-600 hover:text-primary-900">Settings</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-primary-600">
            Made with ❤️ for writers everywhere
          </p>
        </div>
      </footer>
    </div>
  );
} 