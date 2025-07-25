import { StyleSheet, Text, View } from "react-native";
import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Profile from "../../screens/Profile";
import MyAccount from "../../screens/MyAccount";
import About from "../../screens/About";
import Privacy from "../../screens/Privacy";
import Help from "../../screens/Help";
import Fq from "../../screens/Fq";
import { ContextProvider } from "../../context/UserProvider";

const Stack = createNativeStackNavigator();

const ProfileScreen = ({ route }) => {
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId;
  return (
    <Stack.Navigator initialRouteName="Profile">
      <Stack.Screen
        name="Profile"
        initialParams={{ userId: userId }}
        options={{ headerShown: false }}
        component={Profile}
      />
      <Stack.Screen
        name="MyAccount"
        initialParams={{ userId: userId }}
        options={{ headerShown: false }}
        component={MyAccount}
      />
      <Stack.Screen
        name="About"
        initialParams={{ userId: userId }}
        options={{ headerShown: false }}
        component={About}
      />
      <Stack.Screen
        name="Privacy"
        initialParams={{ userId: userId }}
        options={{ headerShown: false }}
        component={Privacy}
      />
      <Stack.Screen
        name="Help"
        initialParams={{ userId: userId }}
        options={{ headerShown: false }}
        component={Help}
      />
      <Stack.Screen
        name="Fq"
        initialParams={{ userId: userId }}
        options={{ headerShown: false }}
        component={Fq}
      />
    </Stack.Navigator>
  );
};

export default ProfileScreen;
