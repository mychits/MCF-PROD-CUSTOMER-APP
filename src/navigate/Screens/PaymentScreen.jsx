import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Payments from "../../screens/Payments";
import ReportList from "../../screens/ReportList";
import EnrollGroup from "../../screens/EnrollGroup";
import ViewMore from "../../screens/ViewMore";
import AuctionsRecord from "../../screens/AuctionsRecord";
import { ContextProvider } from "../../context/UserProvider";

const Stack = createNativeStackNavigator();

const PaymentScreen = ({ route }) => {
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId;

  return (
    <Stack.Navigator initialRouteName="Payments">
      <Stack.Screen
        name="Payments"
        initialParams={{ userId: userId }}
        options={{ headerShown: false }}
        component={Payments}
      />
      <Stack.Screen
        name="ReportList" // Added ReportList as a screen
        initialParams={{ userId: userId }}
        options={{ headerShown: false }}
        component={ReportList}
      />
      <Stack.Screen
        name="EnrollGroup"
        initialParams={{ userId: userId }}
        options={{ headerShown: false }}
        component={EnrollGroup}
      />
      <Stack.Screen
        name="AuctionsRecord"
        initialParams={{ userId: userId }}
        options={{ headerShown: false }}
        component={AuctionsRecord}
      />
      <Stack.Screen
        name="ViewMore"
        initialParams={{ userId: userId }}
        options={{ headerShown: false }}
        component={ViewMore}
      />
    </Stack.Navigator>
  );
};

export default PaymentScreen;
