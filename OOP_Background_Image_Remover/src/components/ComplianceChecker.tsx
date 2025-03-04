import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { ComplianceResult } from '../types';

interface ComplianceCheckerProps {
  result: ComplianceResult;
}

const ComplianceChecker: React.FC<ComplianceCheckerProps> = ({ result }) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className={`px-4 py-3 ${result.isCompliant ? 'bg-green-50' : 'bg-yellow-50'}`}>
        <div className="flex items-center">
          {result.isCompliant ? (
            <CheckCircle className="text-green-500 mr-2" size={20} />
          ) : (
            <AlertTriangle className="text-yellow-500 mr-2" size={20} />
          )}
          <h3 className={`font-medium ${result.isCompliant ? 'text-green-800' : 'text-yellow-800'}`}>
            {result.isCompliant ? 'Photo Compliant' : 'Compliance Issues Detected'}
          </h3>
        </div>
      </div>
      
      {!result.isCompliant && result.issues.length > 0 && (
        <div className="bg-white px-4 py-3">
          <ul className="space-y-2">
            {result.issues.map((issue, index) => (
              <li key={index} className="flex items-start">
                {issue.severity === 'error' ? (
                  <AlertCircle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" size={16} />
                ) : (
                  <AlertTriangle className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" size={16} />
                )}
                <span className="text-sm text-gray-700">{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {result.isCompliant && (
        <div className="bg-white px-4 py-3">
          <p className="text-sm text-gray-700">
            Your photo meets all the requirements for official ID use.
          </p>
        </div>
      )}
    </div>
  );
};

export default ComplianceChecker;