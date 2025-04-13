
import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { ComplianceResult } from '../types';

interface ComplianceCheckerProps {
  result: ComplianceResult;
}

const ComplianceChecker: React.FC<ComplianceCheckerProps> = ({ result }) => {
  // Check if result.issues is array of strings or objects
  const isArrayOfStrings = typeof result.issues[0] === "string";

  // For backward compatibility
  const issues: string[] = isArrayOfStrings
    ? (result.issues as string[])
    : (result.issues as { message: string; severity: string }[]).map((i) => i.message);

  const checklist = [
    { label: "Face detected", key: "No face detected" },
    { label: "Face size within range", key: "Face size is not within required range" },
    { label: "Face is centered", key: "Face is not horizontally centered" },
    { label: "Uniform background", key: "Background is not uniform" },
  ];

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      {/* Header Bar */}
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

      {/* Checklist of criteria */}
      <div className="bg-white px-4 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checklist.map((item, idx) => {
            const valid = !issues.includes(item.key);
            return (
              <div key={idx} className="flex items-center gap-2 text-sm">
                {valid ? (
                  <CheckCircle className="text-green-600 w-5 h-5" />
                ) : (
                  <XCircle className="text-red-500 w-5 h-5" />
                )}
                <span className={valid ? "text-green-700" : "text-red-700"}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* If non-compliant, show explanation */}
      {!result.isCompliant && issues.length > 0 && (
        <div className="bg-white px-4 py-3 border-t">
          <ul className="space-y-2">
            {issues.map((msg, index) => (
              <li key={index} className="flex items-start">
                <AlertCircle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" size={16} />
                <span className="text-sm text-gray-700">{msg}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* If all good */}
      {result.isCompliant && (
        <div className="bg-white px-4 py-3 border-t">
          <p className="text-sm text-gray-700">
            Your photo meets all the requirements for official ID use.
          </p>
        </div>
      )}
    </div>
  );
};

export default ComplianceChecker;



// import React from 'react';
// import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
// import { ComplianceResult } from '../types';

// interface ComplianceCheckerProps {
//   result: ComplianceResult;
// }

// const ComplianceChecker: React.FC<ComplianceCheckerProps> = ({ result }) => {
//   return (
//     <div className="border rounded-lg overflow-hidden">
//       <div className={`px-4 py-3 ${result.isCompliant ? 'bg-green-50' : 'bg-yellow-50'}`}>
//         <div className="flex items-center">
//           {result.isCompliant ? (
//             <CheckCircle className="text-green-500 mr-2" size={20} />
//           ) : (
//             <AlertTriangle className="text-yellow-500 mr-2" size={20} />
//           )}
//           <h3 className={`font-medium ${result.isCompliant ? 'text-green-800' : 'text-yellow-800'}`}>
//             {result.isCompliant ? 'Photo Compliant' : 'Compliance Issues Detected'}
//           </h3>
//         </div>
//       </div>
      
//       {!result.isCompliant && result.issues.length > 0 && (
//         <div className="bg-white px-4 py-3">
//           <ul className="space-y-2">
//             {result.issues.map((issue, index) => (
//               <li key={index} className="flex items-start">
//                 {issue.severity === 'error' ? (
//                   <AlertCircle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" size={16} />
//                 ) : (
//                   <AlertTriangle className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" size={16} />
//                 )}
//                 <span className="text-sm text-gray-700">{issue.message}</span>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
      
//       {result.isCompliant && (
//         <div className="bg-white px-4 py-3">
//           <p className="text-sm text-gray-700">
//             Your photo meets all the requirements for official ID use.
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ComplianceChecker;