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
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";

const imagefirth = require("../../assets/imagefirth.png");
const imagesec = require("../../assets/imagesec.png");
const imagesixth = require("../../assets/imagesixth.png");
const imagethird = require("../../assets/imagethird.png");
const imagone = require("../../assets/imagone.png");
const imahrfifth = require("../../assets/imahrfifth.png");

const { width, height } = Dimensions.get("window");

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

  const cardColors = [
    "#FF6F61", // Vibrant Coral
    "#6B5B95", // Deep Lavender
    "#88B04B", // Olive Green
    "#F7CAC9", // Soft Rose Quartz
    "#92A8D1", // Serenity Blue
    "#EFC050", // Golden Yellow
    "#45B8AC", // Teal
    "#FF9478", // Warm Peach
    "#C1BBDD", // Light Periwinkle
    "#5A807E", // Dark Teal
  ];

  const handleImagePress = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#053B90" />

      {/* Header Section */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Licenses & Certificates</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Scrollable Content Area */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {images.map((img, index) => (
          <ImageCard
            key={img.id}
            img={img}
            index={index}
            cardColor={cardColors[index % cardColors.length]}
            onPress={() => handleImagePress(img)}
            title={img.title}
          />
        ))}
      </ScrollView>

      {/* Full-Screen Image Modal with Zoom */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        {selectedImage && (
          <ImageViewer
            imageUrls={[
              {
                url: Image.resolveAssetSource(selectedImage.source).uri,
                props: { source: selectedImage.source },
              },
            ]}
            enableSwipeDown={true}
            onCancel={closeModal}
            backgroundColor="rgba(0, 0, 0, 0.85)"
            renderHeader={() => (
              <View
                style={[
                  styles.modalViewerHeader,
                  { paddingTop: Platform.OS === "ios" ? insets.top : 20 },
                ]}
              >
                <TouchableOpacity
                  style={styles.modalCloseButtonViewer}
                  onPress={closeModal}
                >
                  <Ionicons name="close-circle" size={40} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.modalViewerTitle}>
                  {selectedImage.title}
                </Text>
                <View style={{ width: 40 }} />
              </View>
            )}
            renderIndicator={(currentIndex, totalImages) => null}
          />
        )}
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
        duration: 600,
        delay: index * 120,
        useNativeDriver: true,
      }).start();
    }
  }, [imageLoading, fadeAnim, index]);

  return (
    <Animated.View style={[styles.imageCardOuter, { opacity: fadeAnim }]}>
      <View style={styles.imageCardContainer}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          style={styles.cardTouchable}
        >
          <View style={styles.cardImageWrapper}>
            {imageLoading && (
              <View style={styles.imageLoader}>
                <ActivityIndicator size="large" color="#053B90" />
              </View>
            )}
            <Image
              source={img.source}
              style={[styles.image, imageLoading && { opacity: 0 }]}
              resizeMode="contain"
              onLoadEnd={() => setImageLoading(false)}
              onError={(e) => {
                console.log(
                  `Error loading image ${img.id}:`,
                  e.nativeEvent.error
                );
                setImageLoading(false);
              }}
            />
          </View>
        </TouchableOpacity>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#053B90",
    paddingHorizontal: 20,
    paddingBottom: 20,

    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  imageCardOuter: {
    borderRadius: 18,
    marginBottom: 25,

    width: width * 0.72, // Adjust this value (e.g., 0.8, 0.75) to make it smaller
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  imageCardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
  },
  cardTouchable: {
    width: "100%",
  },
  cardImageWrapper: {
    width: "100%",

    height: width * 0.85 * 0.75, // Adjust this aspect ratio (e.g., 0.75 for 4:3, 1 for square)
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    zIndex: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  cardTitle: {
    marginTop: 10,
    marginBottom: 15,
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    paddingHorizontal: 15,
  },
  modalViewerHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingBottom: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 1,
  },
  modalCloseButtonViewer: {
    padding: 10,
  },
  modalViewerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
});

export default LicenseAndCertificateScreen;
