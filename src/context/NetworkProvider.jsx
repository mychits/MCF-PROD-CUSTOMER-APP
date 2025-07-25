import React, { createContext, useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

// Create the Network Context
export const NetworkContext = createContext({
  isConnected: true, // Default to true, will be updated by provider
  isInternetReachable: true, // Default to true, will be updated by provider
});

/**
 * NetworkProvider component that monitors network connectivity and provides it
 * to its children via the NetworkContext.
 */
export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      // Update the state based on NetInfo's output
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    // Initial check for network status
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    // Unsubscribe when the component unmounts
    return () => {
      unsubscribe();
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  return (
    <NetworkContext.Provider value={{ isConnected, isInternetReachable }}>
      {children}
    </NetworkContext.Provider>
  );
};
