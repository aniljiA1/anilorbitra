import React from 'react';
import ItineraryDetail from './ItineraryDetail';

// Thin wrapper that renders the detail view in "shared" mode
const SharedItinerary = () => {
  return <ItineraryDetail shared={true} />;
};

export default SharedItinerary;
