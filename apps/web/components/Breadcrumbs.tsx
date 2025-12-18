import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from './Icons';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';

const Breadcrumbs: React.FC = () => {
  const { crumbs } = useBreadcrumbs();
  const location = useLocation();

  // Don't show on root pages or if no crumbs are set
  if (location.pathname === '/' || crumbs.length === 0) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-500 py-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={`${crumb.name}-${index}`} className="flex items-center">
                {index > 0 && <ChevronRightIcon className="w-4 h-4 mx-2 text-gray-400 flex-shrink-0" />}
                {isLast || !crumb.path ? (
                  <span className="font-semibold text-dark-gray truncate" title={crumb.name}>{crumb.name}</span>
                ) : (
                  <Link to={crumb.path} className="hover:text-primary hover:underline truncate" title={crumb.name}>
                    {crumb.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumbs;