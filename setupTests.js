// setupTests.js - Add in ROOT folder (App.tsx ke saath)
import '@testing-library/jest-dom';

// Force set environment variables for development
if (process.env.NODE_ENV === 'development') {
  // These will override .env file during development
  window.ENV = {
    REACT_APP_GEMINI_API_KEY: 'AIzaSyD-Gqia_Qau98oaQ_D0_WbLp0w2JtbeFvc',
    REACT_APP_BSCSCAN_API_KEY: 'I2Q7WUAQESS472CHMN7FBKA4D846M23YJF',
    REACT_APP_BSC_TOKEN_ADDRESS: '0x1D3516E449aC7f08F5773Dc8d984E1174420867a',
    REACT_APP_BSC_STAKING_ADDRESS: '0x1D3516E449aC7f08F5773Dc8d984E1174420867a'
  };
}