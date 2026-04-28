import React, { useState } from "react";

const EmergencySOS = () => {
  const [sosSent, setSosSent] = useState(false);
  const [classification, setClassification] = useState(null);

  const handleSOS = () => {
    setSosSent(true);

    // Simulate AI classification
    setTimeout(() => {
      setClassification({
        type: "Medical",
        severity: "High",
        actions: [
          "Call emergency services immediately",
          "Stay on the line with dispatcher",
          "Do not move the victim",
          "Apply first aid if trained",
          "Clear the area for responders",
        ],
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      {!sosSent ? (
        <button
          onClick={handleSOS}
          className="w-64 h-64 rounded-full bg-red-600 text-white text-4xl font-bold shadow-2xl hover:bg-red-700 active:bg-red-800 animate-pulse transition-all duration-300 flex items-center justify-center border-4 border-red-400"
        >
          🚨 SEND SOS
        </button>
      ) : (
        <div className="text-center text-white space-y-6">
          <div className="text-6xl font-bold text-red-500 animate-pulse">
            SOS SENT
          </div>

          {!classification && (
            <p className="text-lg text-gray-300">
              Analyzing situation...
            </p>
          )}

          {classification && (
            <div className="bg-gray-800 rounded-2xl p-8 max-w-md mx-auto space-y-4 shadow-xl">
              <h2 className="text-2xl font-bold text-white">
                AI Assessment
              </h2>

              <p>
                <span className="font-semibold">Type:</span>{" "}
                {classification.type}
              </p>

              <p>
                <span className="font-semibold">Severity:</span>{" "}
                <span className="text-red-400">
                  {classification.severity}
                </span>
              </p>

              <div className="text-left">
                <p className="font-semibold mb-2">Actions:</p>
                <ul className="list-disc list-inside space-y-1">
                  {classification.actions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmergencySOS;