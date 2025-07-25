import { StyleSheet } from "react-native";
import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../../screens/Home";
import AuctionScreen from "./AuctionScreen";
import ReportScreen from "./ReportScreen";

import IntroduceNewCustomers from "../../screens/IntroduceNewCustomers";
import { ContextProvider } from "../../context/UserProvider";

const Stack = createNativeStackNavigator();

const HomeScreen = ({ route }) => {
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId;
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        options={{ headerShown: false }}
        component={Home}
        initialParams={{ userId: userId }}
      />
      <Stack.Screen
        name="AuctionScreen"
        options={{ headerShown: false }}
        component={AuctionScreen}
        initialParams={{ userId: userId }}
      />
      <Stack.Screen
        name="ReportScreen"
        options={{ headerShown: false }}
        component={ReportScreen}
        initialParams={{ userId: userId }}
      />

      <Stack.Screen
        name="IntroduceNewCustomers" // Use this name in navigation.navigate
        options={{ headerShown: false }}
        component={IntroduceNewCustomers}
        initialParams={{ userId: userId }}
      />
    </Stack.Navigator>
  );
};

export default HomeScreen;
