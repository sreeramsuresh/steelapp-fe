import React from 'react';
import { Box } from '@mui/material';
import MarketingHeader from './MarketingHeader';
import MarketingFooter from './MarketingFooter';

const MarketingLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
      }}
    >
      <MarketingHeader />
      <Box
        component="main"
        sx={{
          flex: 1,
          // Ensure marketing pages always scroll vertically if content exceeds viewport
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>
      <MarketingFooter />
    </Box>
  );
};

export default MarketingLayout;
