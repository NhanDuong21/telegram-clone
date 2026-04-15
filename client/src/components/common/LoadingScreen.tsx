import React from 'react';
import './LoadingScreen.css';

const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="flying-container">
          {/* Wind Streaks Behind */}
          <div className="wind-streaks">
            <div className="streak streak-1"></div>
            <div className="streak streak-2"></div>
            <div className="streak streak-3"></div>
          </div>

          {/* The Paper Plane */}
          <div className="plane-wrapper">
            <svg 
              viewBox="0 0 24 24" 
              className="paper-plane-svg"
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M22 2L11 13" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M22 2L15 22L11 13L2 9L22 2Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="loading-info">
          <h2 className="loading-title">Nyan Telegram</h2>
          <p className="loading-status">
            Đang tải dữ liệu
            <span className="dot">.</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
          </p>
          <div className="loading-progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
