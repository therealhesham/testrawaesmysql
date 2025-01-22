//@ts-ignore
//@ts-nocheck
import React, { useState } from "react";

const Timeline = ({ stages, currentstatus, changeTimeline }) => {
  // Set up local state for the current stage (initialize with initialStage)
  const [currentStage, setCurrentStage] = useState(currentstatus);

  const handleClick = (index) => {
    // alert(stages.indexOf(currentstatus));
    changeTimeline(index);
  };
  // alert(stages.)
  return (
    <div className="w-full flex justify-between items-center py-8">
      {stages.map((stage, index) => {
        const isCompleted = index < stages.indexOf(currentstatus);
        const isActive = index === stages.indexOf(currentstatus);
        const stageColor = isCompleted
          ? "bg-green-500"
          : isActive
          ? "bg-blue-500"
          : "bg-gray-300";

        return (
          <div
            key={stage}
            className="relative flex-1 flex items-center justify-center"
          >
            {/* Circle */}
            <div
              className={`w-8 h-8 rounded-full ${stageColor} flex items-center justify-center text-white cursor-pointer`}
              onClick={() => handleClick(stage)} // Add onClick handler to update stage
            >
              {isCompleted ? (
                <span className="text-sm font-semibold">✓</span>
              ) : (
                <span className="text-sm">{index + 1}</span>
              )}
            </div>

            {/* Line */}
            {index < stages.length - 1 && (
              <div
                className={`absolute top-1/2 left-1/2 w-full h-1 ${
                  isCompleted ? "bg-green-500" : "bg-gray-300"
                }`}
              ></div>
            )}

            {/* Stage Label */}
            <div
              className={`mt-4 text-center ${
                isCompleted
                  ? "text-green-500"
                  : isActive
                  ? "text-blue-500"
                  : "text-gray-500"
              }`}
            >
              {stage}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
