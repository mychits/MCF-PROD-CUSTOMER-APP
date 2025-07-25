import { StyleSheet, Text, View } from "react-native";
import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../../screens/Home";
import AuctionList from "../../screens/AuctionList";
import { ContextProvider } from "../../context/UserProvider";

const Stack = createNativeStackNavigator();

const AuctionScreen = ({ route }) => {
 
     const [appUser,setAppUser] = useContext(ContextProvider);
      const userId = appUser.userId || {};
  return (
    <Stack.Navigator initialRouteName="AuctionList">
      <Stack.Screen
        name="AuctionList"
        options={{ headerShown: false }}
        component={AuctionList}
        initialParams={{ userId: userId }}
      />
    </Stack.Navigator>
  );
};

export default AuctionScreen;
