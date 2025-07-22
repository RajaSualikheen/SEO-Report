import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const ReportCard = ({ title, status, explanation }) => {
  let statusIcon;
  let statusColorClass;
  let statusText;

  switch (status) {
    case 'good':
      statusIcon = <CheckCircle className="w-6 h-6 text-green-500" />;
      statusColorClass = 'text-green-500';
      statusText = 'Good';
      break;
    case 'warning':
      statusIcon = <AlertTriangle className="w-6 h-6 text-orange-500" />;
      statusColorClass = 'text-orange-500';
      statusText = 'Needs Fix';
      break;
    case 'bad':
      statusIcon = <AlertTriangle className="w-6 h-6 text-red-500" />; // Using red for 'bad'
      statusColorClass = 'text-red-500';
      statusText = 'Critical Issue';
      break;
    default:
      statusIcon = null;
      statusColorClass = 'text-gray-500';
      statusText = 'N/A';
  }

  return (
    <motion.div
      className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-start text-left"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
    >
      <div className="flex items-center mb-3">
        {statusIcon}
        <h3 className="text-xl font-semibold text-gray-900 ml-2">{title}</h3>
      </div>
      <p className={`text-sm font-medium ${statusColorClass} mb-4`}>Status: {statusText}</p>
      <p className="text-gray-600 mb-6 flex-grow">{explanation}</p>

    </motion.div>
  );
};

export default ReportCard;
