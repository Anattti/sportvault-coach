import React from 'react';

interface PulsingLogoProps {
  width?: number;
  height?: number;
}

export default function PulsingLogo({ width = 100, height = 100 }: PulsingLogoProps) {
  return (
    <div className="flex items-center justify-center">
      <svg
        width={width}
        height={height}
        viewBox="0 0 270 439"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>
          {`
            @keyframes drawStroke {
              0% {
                stroke-dashoffset: 1500;
              }
              100% {
                stroke-dashoffset: 0;
              }
            }

            @keyframes fillLogo {
              0% {
                fill: transparent;
              }
              100% {
                fill: #00FF41;
              }
            }

            @keyframes glowPulse {
              0% {
                filter: drop-shadow(0 0 2px #00FF41);
              }
              50% {
                filter: drop-shadow(0 0 8px #00FF41);
              }
              100% {
                filter: drop-shadow(0 0 2px #00FF41);
              }
            }

            .drawing-path {
              stroke: #00FF41;
              stroke-width: 25;
              stroke-dasharray: 1500;
              fill: transparent;
              animation: 
                drawStroke 2s ease-out forwards,
                fillLogo 2s ease-in-out forwards 2s,
                glowPulse 5s ease-in-out infinite 4s;
            }
          `}
        </style>
        <path
          className="drawing-path"
          d="M258.84 181H161.214C158.189 181 155.857 178.335 156.258 175.337L178.173 11.6178C178.874 6.3812 172.031 3.77757 169.074 8.15566L7.26781 247.701C5.02479 251.022 7.4039 255.5 11.4111 255.5H115.773C118.802 255.5 121.136 258.173 120.727 261.175L98.0463 427.641C97.3239 432.943 104.311 435.522 107.206 431.021L263.045 188.705C265.185 185.377 262.796 181 258.84 181Z"
        />
      </svg>
    </div>
  );
}
