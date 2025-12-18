
import React, { useEffect } from 'react';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';

const TermsPage: React.FC = () => {
  const { setCrumbs } = useBreadcrumbs();

  useEffect(() => {
    setCrumbs([
      { name: 'Home', path: '/' },
      { name: 'Terms and Conditions' }
    ]);
    return () => setCrumbs([]);
  }, [setCrumbs]);

  return (
    <div className="bg-light-gray min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-dark-gray mb-2">Terms and Conditions</h1>
          <p className="text-gray-500 mb-8 text-sm">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
            <section>
              <h2 className="text-lg font-bold text-dark-gray mb-2">1. Introduction</h2>
              <p>
                Welcome to Job Portal Pro. By accessing our website and using our services, you agree to be bound by these Terms and Conditions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark-gray mb-2">2. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark-gray mb-2">3. Job Postings</h2>
              <p>
                Recruiters agree that all job postings you submit will be for legitimate employment opportunities. We reserve the right to remove any posting that violates our policies.
              </p>
            </section>
            
             <section>
              <h2 className="text-lg font-bold text-dark-gray mb-2">4. Data Privacy</h2>
              <p>
                Your use of the site is also governed by our Privacy Policy. Please review our Privacy Policy to understand how we collect and use your information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-dark-gray mb-2">5. Limitations</h2>
              <p>
                In no event shall Job Portal Pro be liable for any damages arising out of the use or inability to use the materials on Job Portal Pro's website.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
