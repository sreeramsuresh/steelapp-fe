/**
 * BrandmarkHero.jsx
 * Animated brandmark hero section for HomePage
 * Features: Slide-in + rotation + breathing pulse + hover spin
 * Easily removable component (rollback: just delete this file)
 */

import { useTheme } from '../contexts/ThemeContext';

const BrandmarkHero = () => {
  const { isDarkMode } = useTheme();

  return (
    <>
      <style>
        {`
          @keyframes slideInFromTop {
            from {
              opacity: 0;
              transform: translateY(-40px) rotateX(30deg);
            }
            to {
              opacity: 1;
              transform: translateY(0) rotateX(0deg);
            }
          }

          @keyframes breathingPulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.03);
              opacity: 0.95;
            }
          }

          @keyframes spinOnHover {
            from {
              transform: rotateZ(0deg);
            }
            to {
              transform: rotateZ(360deg);
            }
          }

          .brandmark-hero {
            animation: slideInFromTop 0.8s ease-out;
          }

          .brandmark-logo {
            animation: breathingPulse 3s ease-in-out infinite;
            transition: all 0.3s ease;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
          }

          .brandmark-logo:hover {
            animation: spinOnHover 0.6s ease-in-out, breathingPulse 3s ease-in-out infinite;
            filter: drop-shadow(0 8px 20px rgba(20, 184, 166, 0.3));
          }

          .brandmark-text {
            animation: slideInFromTop 0.8s ease-out 0.1s both;
          }

          .brandmark-divider {
            animation: slideInFromTop 0.8s ease-out 0.2s both;
            background: linear-gradient(90deg,
              transparent 0%,
              ${isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.2)'} 50%,
              transparent 100%);
          }
        `}
      </style>

      <div className="brandmark-hero mb-12">
      {/* Logo Section */}
      <div className="flex justify-center mb-8">
        <div className="brandmark-logo cursor-pointer">
          <img
            src="/assets/brandmark.jpeg"
            alt="Ultimate Steels Brandmark"
            className="h-16 md:h-20 w-auto"
          />
        </div>
      </div>

      {/* Company Name & Tagline */}
      <div className="brandmark-text text-center mb-6">
        <h1
          className={`text-2xl md:text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Ultimate Steels
        </h1>
        <p
          className={`text-sm md:text-base ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Building Materials Trading Platform
        </p>
      </div>

      {/* Divider */}
      <div className="brandmark-divider h-px mb-8"></div>
      </div>
    </>
  );
};

export default BrandmarkHero;
