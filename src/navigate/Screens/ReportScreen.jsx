// ReportScreen.js
import { StyleSheet, Text, View } from "react-native";
import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../../screens/Home"; // This import is currently unused, consider removing if not needed.
import ReportList from "../../screens/ReportList";
import { ContextProvider } from "../../context/UserProvider";

const Stack = createNativeStackNavigator();

const ReportScreen = ({ route }) => {
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};

  return (
    <Stack.Navigator initialRouteName="ReportList">
      <Stack.Screen
        name="ReportList"
        options={{ headerShown: false }}
        component={ReportList}
        initialParams={{ userId: userId }}
      />
    </Stack.Navigator>
  );
};

export default ReportScreen;
