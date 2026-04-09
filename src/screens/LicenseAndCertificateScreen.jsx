import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Animated,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// --- Asset Imports ---
const imagefirth = require("../../assets/imagefirth.png");
const imagesec = require("../../assets/imagesec.png");
const imagesixth = require("../../assets/imagesixth.png");
const imagethird = require("../../assets/imagethird.png");
const imagone = require("../../assets/imagone.png");
const imahrfifth = require("../../assets/imahrfifth.png");

const LicenseAndCertificateScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedImage, setSelectedImage] = useState(null);

  const images = [
    { id: "1", source: imagone, title: "Certificate Of Incorporation" },
    { id: "2", source: imagesec, title: "Registration Certificate" },
    { id: "3", source: imagethird, title: "e-PAN Card" },
    { id: "4", source: imagefirth, title: "Income Tax Department" },
    { id: "5", source: imahrfifth, title: "Certificate Of Registration" },
    { id: "6", source: imagesixth, title: "Licenses" },
  ];

  const closeModal = () => setSelectedImage(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Licenses & Certificates</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Main List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {images.map((img, index) => (
          <ImageCard
            key={img.id}
            img={img}
            index={index}
            onPress={() => setSelectedImage(img)}
            title={img.title}
          />
        ))}
      </ScrollView>

      {/* Full Screen Viewer Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalBackground}>
          {/* Top Close Button */}
          <TouchableOpacity 
            style={[styles.modalCloseBtn, { top: insets.top + 10 }]} 
            onPress={closeModal}
          >
            <Ionicons name="close-circle" size={45} color="white" />
          </TouchableOpacity>

          <ScrollView
            maximumZoomScale={5}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.zoomContent} // Ensures center alignment
          >
            {selectedImage && (
              <Image
                source={selectedImage.source}
                style={styles.fullImage}
                resizeMode="contain" // This ensures the whole image fits without cropping
              />
            )}
          </ScrollView>

          {/* Bottom Caption */}
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalFooterText}>{selectedImage?.title}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const ImageCard = ({ img, index, onPress, title }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!imageLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }
  }, [imageLoading]);

  return (
    <Animated.View style={[styles.imageCardOuter, { opacity: fadeAnim }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.cardImageWrapper}>
          {imageLoading && <ActivityIndicator style={styles.loader} color="#053B90" />}
          <Image
            source={img.source}
            style={styles.thumbnailImage}
            onLoadEnd={() => setImageLoading(false)}
          />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#053B90",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "bold", flex: 1, textAlign: "center" },
  backButton: { padding: 5 },
  scrollContent: { paddingVertical: 20, alignItems: "center" },
  imageCardOuter: {
    width: width * 0.9,
    marginBottom: 20,
    backgroundColor: "#FFF",
    borderRadius: 12,
    elevation: 3,
    overflow: "hidden",
  },
  cardImageWrapper: { height: 200, backgroundColor: "#EEE", justifyContent: "center" },
  thumbnailImage: { width: "100%", height: "100%", resizeMode: "cover" },
  loader: { position: "absolute", alignSelf: "center" },
  cardTitle: { padding: 12, textAlign: "center", fontWeight: "600", color: "#333" },
  
  // Modal Fixes
  modalBackground: { flex: 1, backgroundColor: "#000" },
  modalCloseBtn: { position: "absolute", right: 20, zIndex: 10 },
  zoomContent: {
    flexGrow: 1, // Important: Allows the content to fill the ScrollView for centering
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: width,   // Full screen width
    height: height, // Full screen height - ensures the image has a box to live in
  },
  modalFooter: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 15,
    alignItems: "center",
  },
  modalFooterText: { color: "white", fontWeight: "bold" },
});

export default LicenseAndCertificateScreen;