import React, { useState, useEffect, useRef, useContext } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  SafeAreaView,
  Keyboard,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import url from "../data/url";
import { ContextProvider } from "../context/UserProvider";

const { height: screenHeight } = Dimensions.get("window");

const Toast = React.forwardRef(({ duration = 2000 }, ref) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [imageSource, setImageSource] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;

  React.useImperativeHandle(ref, () => ({
    show: (msg, imgSrc) => {
      setMessage(msg);
      setImageSource(imgSrc);
      setVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
            setMessage("");
            setImageSource(null);
          });
        }, duration);
      });
    },
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastContainer, { opacity }]}>
      <View style={styles.toastContent}>
        {imageSource && (
          <Image source={imageSource} style={styles.toastImage} />
        )}
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
});

// export default function Register() {
//   const navigation = useNavigation();
//   const toastRef = useRef();
//   const [appUser, setAppUser] = useContext(ContextProvider);

//   const [fullName, setFullName] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [referralCode, setReferralCode] = useState("");
//   const [showReferralInput, setShowReferralInput] = useState(false); // State to manage visibility
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [keyboardVisible, setKeyboardVisible] = useState(false);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const keyboardDidShowListener = Keyboard.addListener(
//       "keyboardDidShow",
//       () => {
//         setKeyboardVisible(true);
//       }
//     );
//     const keyboardDidHideListener = Keyboard.addListener(
//       "keyboardDidHide",
//       () => {
//         setKeyboardVisible(false);
//       }
//     );

//     return () => {
//       keyboardDidHideListener.remove();
//       keyboardDidShowListener.remove();
//     };
//   }, []);

//   const showAppToast = (message) => {
//     if (toastRef.current) {
//       toastRef.current.show(message, require("../../assets/Group400.png"));
//     }
//   };

//   const validateInputs = () => {
//     const trimmedFullName = fullName.trim();
//     const trimmedPhoneNumber = phoneNumber.replace(/\s/g, "");
//     const trimmedPassword = password.trim();
//     const trimmedConfirmPassword = confirmPassword.trim();

//     if (
//       !trimmedFullName ||
//       !trimmedPhoneNumber ||
//       !trimmedPassword ||
//       !trimmedConfirmPassword
//     ) {
//       showAppToast("Please fill all required fields (Name, Phone, Password).");
//       return false;
//     }

//     if (trimmedPassword !== trimmedConfirmPassword) {
//       showAppToast("Passwords do not match.");
//       return false;
//     }

//     if (trimmedPhoneNumber.length !== 10 || isNaN(trimmedPhoneNumber)) {
//       showAppToast("Phone number must be 10 digits.");
//       return false;
//     }
//     return true;
//   };

//   const handleSendOtp = async () => {
//     if (!validateInputs()) {
//       return;
//     }
//     setLoading(true);
//     try {
//       const payload = {
//         phone_number: phoneNumber.replace(/\s/g, ""),
//         full_name: fullName.trim(),
//         // Conditionally add referral_code if the input is not empty
//         ...(referralCode.trim() && { referral_code: referralCode.trim() }),
//       };
     
//       const apiEndpoint = `${url}/user/send-register-otp`; 
      
//       console.log("Attempting to send OTP to:", apiEndpoint); 
//       console.log("Sending OTP payload:", payload);

//       const response = await fetch(apiEndpoint, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const contentType = response.headers.get("content-type");
//       if (response.ok && contentType && contentType.includes("application/json")) {
//         const data = await response.json();
//         console.log("OTP send success response:", data);
//         showAppToast(data.message || "OTP sent successfully!");
//         navigation.navigate("RegisterOtpVerify", {
//           mobileNumber: phoneNumber.replace(/\s/g, ""),
//           fullName: fullName.trim(),
//           password: password.trim(),
//           referralCode: referralCode.trim(),
//         });
//       } else {
//         let errorMessage = "Failed to send OTP. Please try again.";
//         if (contentType && contentType.includes("application/json")) {
//           const errorData = await response.json();
//           errorMessage = errorData.message || errorMessage;
//           console.error("OTP send error (JSON response):", errorData);
//         } else {
//           const errorText = await response.text();
//           console.error("OTP send error (non-JSON response):", response.status, errorText);
//           errorMessage = `Server Error (${response.status}): ${errorText.substring(0, 100)}... Please check your backend route.`;
//         }
//         showAppToast(errorMessage);
//       }
//     } catch (error) {
//       console.error("Network or unexpected error sending OTP:", error);
//       showAppToast("An unexpected error occurred. Please check your network and try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="light-content" backgroundColor="#053B90" />
//       <KeyboardAvoidingView
//         style={styles.keyboardAvoidingView}
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         keyboardVerticalOffset={
//           Platform.OS === "ios" ? 0 : -screenHeight * 0.15
//         }
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollViewContent}
//           keyboardShouldPersistTaps="handled"
//         >
//           {!keyboardVisible && (
//             <View style={styles.topSection}>
//               <Image
//                 source={require("../../assets/Group400.png")}
//                 style={styles.logo}
//                 resizeMode="contain"
//               />
//               <Text style={styles.title}>MyChits</Text>
//             </View>
//           )}

//           <View style={[styles.bottomSection, { paddingTop: 30 }]}>
//             <Text style={styles.registerTitle}>Register</Text>
//             <Text style={styles.registerSubtitle}>Create your account</Text>

           
//             <TextInput
//               style={styles.input}
//               placeholder="Full Name"
//               placeholderTextColor="#78909C"
//               value={fullName}
//               onChangeText={setFullName}
//               accessible
//               accessibilityLabel="Full name input"
//               autoCapitalize="words"
//               autoCorrect={false}
//             />

           
//             <TextInput
//               style={styles.input}
//               placeholder="Phone Number"
//               placeholderTextColor="#78909C"
//               keyboardType="phone-pad"
//               value={phoneNumber}
//               onChangeText={(text) =>
//                 setPhoneNumber(text.replace(/[^0-9]/g, ""))
//               }
//               maxLength={10}
//               accessible
//               accessibilityLabel="Phone number input"
//               autoCapitalize="none"
//               autoCorrect={false}
//             />

           
//             <View style={styles.passwordInputContainer}>
//               <TextInput
//                 style={styles.passwordInput}
//                 placeholder="Create Password"
//                 placeholderTextColor="#78909C"
//                 secureTextEntry={!showPassword}
//                 value={password}
//                 onChangeText={setPassword}
//                 accessible
//                 accessibilityLabel="Password input"
//                 autoCapitalize="none"
//                 autoCorrect={false}
//               />
//               <TouchableOpacity
//                 onPress={() => setShowPassword(!showPassword)}
//                 style={styles.eyeIcon}
//                 accessible
//                 accessibilityLabel="Toggle password visibility"
//               >
//                 <AntDesign
//                   name={showPassword ? "eye" : "eyeo"}
//                   size={20}
//                   color="#78909C"
//                 />
//               </TouchableOpacity>
//             </View>

           
//             <View style={styles.passwordInputContainer}>
//               <TextInput
//                 style={styles.passwordInput}
//                 placeholder="Confirm Password"
//                 placeholderTextColor="#78909C"
//                 secureTextEntry={!showConfirmPassword}
//                 value={confirmPassword}
//                 onChangeText={setConfirmPassword}
//                 accessible
//                 accessibilityLabel="Confirm password input"
//                 autoCapitalize="none"
//                 autoCorrect={false}
//               />
//               <TouchableOpacity
//                 onPress={() => setShowConfirmPassword(!showConfirmPassword)}
//                 style={styles.eyeIcon}
//                 accessible
//                 accessibilityLabel="Toggle confirm password visibility"
//               >
//                 <AntDesign
//                   name={showConfirmPassword ? "eye" : "eyeo"}
//                   size={20}
//                   color="#78909C"
//                 />
//               </TouchableOpacity>
//             </View>
            
//             {/* Conditional Rendering for Referral Code */}
//             {showReferralInput ? (
//                 // Block shown when the input is active
//                 <View style={styles.referralInputGroup}>
//                     {/* NEW: Skip Link */}
//                     <TouchableOpacity
//                         onPress={() => {
//                             setShowReferralInput(false); // Hide the input
//                             setReferralCode(""); // Clear the input value
//                         }}
//                         style={styles.skipLinkContainer} 
//                         accessible
//                         accessibilityLabel="Skip referral code input"
//                     >
//                         <Text style={styles.skipLinkText}>
//                             Skip
//                         </Text>
//                     </TouchableOpacity>
                    
//                     {/* Referral Input Field */}
//                     <TextInput
//                         style={styles.input}
//                         placeholder="Referral Number (Optional)"
//                         placeholderTextColor="#78909C"
//                         value={referralCode}
//                         onChangeText={setReferralCode}
//                         accessible
//                         accessibilityLabel="Referral Code input"
//                         autoCapitalize="none"
//                         autoCorrect={false}
//                     />
//                 </View>
//             ) : (
//                 // Block shown when the link is active
//                 <TouchableOpacity
//                     onPress={() => setShowReferralInput(true)}
//                     style={styles.referralLinkContainer}
//                     accessible
//                     accessibilityLabel="I have a referral code link"
//                 >
//                     <Text style={styles.referralLinkText}>
//                         Have a referral code?
//                     </Text>
//                 </TouchableOpacity>
//             )}

//             <TouchableOpacity
//               style={styles.registerButton}
//               onPress={handleSendOtp}
//               accessible
//               accessibilityLabel="Send OTP"
//               disabled={loading}
//             >
//               {loading ? (
//                 <ActivityIndicator color="white" />
//               ) : (
//                 <Text style={styles.registerButtonText}>Send OTP</Text>
//               )}
//             </TouchableOpacity>

//             <View style={styles.loginContainer}>
//               <Text style={styles.loginText}>Already have an account? </Text>
//               <TouchableOpacity
//                 onPress={() => navigation.navigate("Login")}
//                 accessible
//                 accessibilityLabel="Navigate to Login"
//               >
//                 <Text style={styles.loginButtonText}>Log in</Text>
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Loading Overlay */}
//           {loading && (
//             <View style={styles.loadingOverlay}>
//               <ActivityIndicator size="large" color="#053B90" />
//               <Text style={styles.loadingText}>Sending OTP...</Text>
//             </View>
//           )}
//         </ScrollView>
//       </KeyboardAvoidingView>

//       <Toast ref={toastRef} />
//     </SafeAreaView>
//   );
// }

export default function Register() {
  const navigation = useNavigation();
  const toastRef = useRef();
  const [appUser, setAppUser] = useContext(ContextProvider); // kept for future use

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showReferralInput, setShowReferralInput] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= KEYBOARD LISTENER ================= */

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const showAppToast = (message) => {
    toastRef.current?.show(message, require("../../assets/Group400.png"));
  };

  /* ================= INPUT VALIDATION ================= */

  const validateInputs = () => {
    const name = fullName.trim();
    const phone = phoneNumber.replace(/\s/g, "");
    const pass = password.trim();
    const confirm = confirmPassword.trim();

    if (!name || !phone || !pass || !confirm) {
      showAppToast("Please fill all required fields.");
      return false;
    }

    if (phone.length !== 10 || isNaN(phone)) {
      showAppToast("Phone number must be 10 digits.");
      return false;
    }

    if (pass !== confirm) {
      showAppToast("Passwords do not match.");
      return false;
    }

    if (pass.length < 4) {
      showAppToast("Password must be at least 4 characters.");
      return false;
    }

    return true;
  };

  /* ================= SEND OTP HANDLER ================= */

  const handleSendOtp = async () => {
    if (!validateInputs()) return;

    setLoading(true);

    try {
      const payload = {
        phone_number: phoneNumber.replace(/\s/g, ""),
        full_name: fullName.trim(),
        ...(referralCode.trim() && { referral_code: referralCode.trim() }),
      };

      const apiEndpoint = `${url}/user/signup-otp`;

      console.log("Sending OTP payload:", payload);

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");

      if (response.ok && contentType?.includes("application/json")) {
        const data = await response.json();

        showAppToast(data.message || "OTP sent successfully!");

        navigation.navigate("RegisterOtpVerify", {
          mobileNumber: payload.phone_number,
          fullName: payload.full_name,
          password: password.trim(),
          referralCode: referralCode.trim(),
        });
      } else {
        let errorMessage = "Failed to send OTP. Please try again.";

        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          errorMessage = `Server error (${response.status})`;
        }

        showAppToast(errorMessage);
      }
    } catch (error) {
      console.error("OTP Error:", error);
      showAppToast("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 0 : -screenHeight * 0.15
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          {!keyboardVisible && (
            <View style={styles.topSection}>
              <Image
                source={require("../../assets/Group400.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>MyChits</Text>
            </View>
          )}

          <View style={[styles.bottomSection, { paddingTop: 30 }]}>
            <Text style={styles.registerTitle}>Register</Text>
            <Text style={styles.registerSubtitle}>Create your account</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9]/g, ""))}
              maxLength={10}
            />

            {/* Password */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Create Password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <AntDesign
                  name={showPassword ? "eye" : "eyeo"}
                  size={20}
                  color="#78909C"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <AntDesign
                  name={showConfirmPassword ? "eye" : "eyeo"}
                  size={20}
                  color="#78909C"
                />
              </TouchableOpacity>
            </View>

            {/* Referral */}
            {showReferralInput ? (
              <View style={styles.referralInputGroup}>
                <TouchableOpacity
                  onPress={() => {
                    setShowReferralInput(false);
                    setReferralCode("");
                  }}
                  style={styles.skipLinkContainer}
                >
                  <Text style={styles.skipLinkText}>Skip</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  placeholder="Referral Number (Optional)"
                  value={referralCode}
                  onChangeText={setReferralCode}
                />
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowReferralInput(true)}
                style={styles.referralLinkContainer}
              >
                <Text style={styles.referralLinkText}>
                  Have a referral code?
                </Text>
              </TouchableOpacity>
            )}

            {/* Send OTP */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                loading && { opacity: 0.7 },
              ]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.registerButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginButtonText}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast ref={toastRef} />
    </SafeAreaView>
  );
}







const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#053B90",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  topSection: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#053B90",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingVertical: 20,
    width: "100%",
  },
  logo: {
    width: 110,
    height: 110,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 1,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: "#C7E3EF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
    width: "100%",
  },
  registerTitle: {
    color: "#000",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  registerSubtitle: {
    color: "#000",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    width: "90%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#053B90",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#B3E5FC",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    height: 50,
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ADD8E6",
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#053B90",
  },
  eyeIcon: {
    padding: 12,
  },
  registerButton: {
    backgroundColor: "#053B90",
    borderRadius: 120,
    paddingVertical: 12,
    width: "70%",
    alignItems: "center",
    marginBottom: 18,
    marginTop: 10,
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: "row",
    marginTop: 15,
    alignItems: "center",
  },
  loginText: {
    color: "#78909C",
    fontSize: 14,
  },
  loginButtonText: {
    color: "#053B90",
    fontSize: 14,
    fontWeight: "bold",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#053B90",
  },
  toastContainer: {
    position: "absolute",
    top: 40,
    left: "5%",
    right: "5%",
    backgroundColor: "rgba(238, 243, 247, 0.9)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    zIndex: 9999,
    alignItems: "center",
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  toastText: {
    color: "#053B90",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 10,
  },
  toastImage: {
    width: 30,
    height: 30,
  },
  // Style for the initial 'Have a referral code?' link
  referralLinkContainer: {
    width: "90%",
    alignItems: "flex-end",
    marginBottom: 12,
    paddingRight: 5,
  },
  referralLinkText: {
    color: "#053B90",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  // NEW styles for the active referral input group and skip link
  referralInputGroup: {
    width: "100%", 
    alignItems: "center", 
    // marginBottom is handled by the input's own marginBottom: 12
  },
  skipLinkContainer: {
    width: "90%", 
    alignItems: "flex-end", 
    marginBottom: 5, 
    paddingRight: 5, 
  },
  skipLinkText: {
    color: "#053B90", // A distinct color for "Skip"
    fontSize: 13,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});