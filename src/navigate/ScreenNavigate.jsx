import React, { useContext } from "react";
import { StatusBar, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import FlashScreen from "../screens/FlashScreen";
import Login from "../screens/Login";
import Register from "../screens/Register";
import ForgotPassword from "../screens/ForgotPassword";
import Otp from "../screens/Otp";
import ConformNewPassword from "../screens/ConformNewPassword";
import PasswordChanged from "../screens/PasswordChanged";
import ReportScreen from "./Screens/ReportScreen";
import IntroduceNewCustomers from "../screens/IntroduceNewCustomers";
import Insurance from "../screens/Insurance";
import EligibilityScreen from "../screens/EligibilityScreen";
import RegisterOtpVerify from "../screens/RegisterOtpVerify.jsx";
import HomeScreen from "./Screens/HomeScreen";
import EnrollScreen from "./Screens/EnrollScreen";
import PaymentScreen from "./Screens/PaymentScreen";

import QrCodePage from "../screens/QrCodePage";
import ProfileScreen from "./Screens/ProfileScreen";
import EnrollGroup from "../screens/EnrollGroup";
import AuctionsRecord from "../screens/AuctionsRecord";
import ViewMore from "../screens/ViewMore";
import EnrollForm from "../screens/EnrollForm";
import FeatureComingSoon from "../screens/FeatureComingSoon";
import PayYourDues from "../screens/PayYourDues";
import AuctionList from "../screens/AuctionList";
import Enrollment from "../screens/Enrollment";
import MyLoan from "../screens/MyLoan.jsx";
import OffersScreen from "../screens/OffersScreen.jsx"; ``
import RewardsScreen from "../screens/RewardsScreen.jsx";
import Dashboard from "../screens/Dashboard.jsx";
import PayOnline from "../screens/PayOnline.jsx";
import OnlineAuction from "../screens/OnlineAuction.jsx";


import About from "../screens/About";
import Privacy from "../screens/Privacy";
import Help from "../screens/Help";
import Fq from "../screens/Fq";

import LicenseAndCertificateScreen from "../screens/LicenseAndCertificateScreen";
import Becomeanagent from "../screens/Becomeanagent";
import MyPassbookScreen from "../screens/MyPassbookScreen";
import Payments from "../screens/Payments";
import TermsConditions from "../screens/Termsconditions";
import EnrollConfirm from "../screens/EnrollConfirm";
import Mygroups from "../screens/Mygroups";
import MoreInformation from "../screens/MoreInformation";
import Ionicons from "react-native-vector-icons/Ionicons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import UserProvider, { ContextProvider } from "../context/UserProvider";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const EnrollStack = createNativeStackNavigator();

const EnrollStackNavigator = ({ route }) => {
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId;
  return (
    <EnrollStack.Navigator>
      <EnrollStack.Screen
        name="EnrollScreenMain"
        component={EnrollScreen}
        options={{ headerShown: false }}
        initialParams={{ userId }}
      />
      <EnrollStack.Screen
        name="EnrollGroup"
        component={EnrollGroup}
        options={{ headerShown: false }}
      />

      <EnrollStack.Screen
        name="AuctionsRecord"
        component={AuctionsRecord}
        options={{ headerShown: false }}
      />

      <EnrollStack.Screen
        name="ViewMore"
        component={ViewMore}
        options={{ headerShown: false }}
      />
    </EnrollStack.Navigator>
  );
};
const TabNavigate = ({ route }) => {
  const [appUser, setAppUser] = useContext(ContextProvider);
  const userId = appUser.userId || {};
  return (
    <Tab.Navigator
      initialRouteName="HomeScreen"
      screenOptions={{
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 17,
          right: 17,
          elevation: 0,
          backgroundColor: "#053B90",
          borderRadius: 0,
          height: 45,
          borderTopWidth: 0,
          ...styles.shadow,
        },
        tabBarLabelStyle: { display: "none" },
      }}
    >
      <Tab.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={25}
              color="#fff"
            />
          ),
        }}
        initialParams={{ userId }}
      />
      <Tab.Screen
        name="EnrollTab"
        component={EnrollStackNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name={focused ? "account-plus" : "account-plus-outline"}
              size={28}
              color="#fff"
            />
          ),
        }}
        initialParams={{ userId }}
      />
      <Tab.Screen
        name="PaymentScreen"
        component={PaymentScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "card" : "card-outline"}
              size={25}
              color="#fff"
            />
          ),
        }}
        initialParams={{ userId }}
      />
      <Tab.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={25}
              color="#fff"
            />
          ),
        }}
        initialParams={{ userId }}
      />
    </Tab.Navigator>
  );
};
export default function ScreenNavigate() {
  return (
    <UserProvider>
      {" "}
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#053B90" />
        <Stack.Navigator initialRouteName="FlashScreen">
          <Stack.Screen
            name="FlashScreen"
            component={FlashScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OffersScreen"
            component={OffersScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RewardsScreen"
            component={RewardsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={Register}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPassword}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Otp"
            component={Otp}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConformNewPassword"
            component={ConformNewPassword}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PasswordChanged"
            component={PasswordChanged}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="ReportScreen"
            component={ReportScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="IntroduceNewCustomers"
            component={IntroduceNewCustomers}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="About"
            component={About}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Privacy"
            component={Privacy}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Help"
            component={Help}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RegisterOtpVerify"
            component={RegisterOtpVerify}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="MyLoan"
            component={MyLoan}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="QrCodePage"
            component={QrCodePage}
            options={{ headerShown: false }}
          />


          <Stack.Screen
            name="Fq"
            component={Fq}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FeatureComingSoon"
            component={FeatureComingSoon}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="BottomTab"
            component={TabNavigate}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LicenseAndCertificate"
            component={LicenseAndCertificateScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Insurance"
            component={Insurance}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Enrollment"
            component={Enrollment}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Becomeanagent"
            component={Becomeanagent}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PayOnline"
            component={PayOnline}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MyPassbookScreen"
            component={MyPassbookScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Payments"
            component={Payments}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EligibilityScreen"
            component={EligibilityScreen}
            options={{ headerShown: false }}
          />


          <Stack.Screen
            name="EnrollForm"
            component={EnrollForm}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TermsConditions"
            component={TermsConditions}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Dashboard"
            component={Dashboard}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EnrollConfirm"
            component={EnrollConfirm}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Mygroups"
            component={Mygroups}
            options={{ headerShown: false }}
          />
          {/* CORRECT: Use the same Stack instance as the surrounding screens */}
          <Stack.Screen
            name="OnlineAuction"
            component={OnlineAuction}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MoreInformation"
            component={MoreInformation}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EnrollGroup"
            component={EnrollGroup}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="PayYourDues"
            component={PayYourDues}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AuctionList"
            component={AuctionList}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AuctionsRecord"
            component={AuctionsRecord}
            options={{ headerShown: true, title: 'Auction Records' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
});


















