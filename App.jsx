import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
 
 
import ScreenNavigate from "./src/navigate/ScreenNavigate"; // Correct path to ScreenNavigate

 
import { NetworkProvider } from './src/context/NetworkProvider'; // <<< CORRECTED PATH

export default function App() {
  return (
 
    <NetworkProvider>
      <StatusBar style="dark" /> {/* Or "auto", "light" depending on your preference */}
      <ScreenNavigate />
    </NetworkProvider>
  );
}

 
 
 
 
 
 
 
 
 