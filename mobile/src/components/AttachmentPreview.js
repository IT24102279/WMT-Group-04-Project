import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { showToast } from '../utils/toast';

const isPdfUrl = (url) => /\.pdf($|\?)/i.test(url);
const isImageUrl = (url) => /\.(png|jpe?g|gif|webp)($|\?)/i.test(url);

const AttachmentPreview = ({ url, imageLabel = 'Attachment Image', pdfLabel = 'Open PDF' }) => {
  if (!url) {
    return null;
  }

  const handleOpen = async () => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        showToast('Cannot open attachment URL');
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      showToast('Failed to open attachment');
    }
  };

  if (isPdfUrl(url)) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.label}>PDF Attachment</Text>
        <Pressable style={styles.openButton} onPress={handleOpen}>
          <Text style={styles.openButtonText}>{pdfLabel}</Text>
        </Pressable>
      </View>
    );
  }

  if (isImageUrl(url)) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.label}>{imageLabel}</Text>
        <Image source={{ uri: url }} style={styles.previewImage} resizeMode="cover" />
        <Pressable style={styles.openButton} onPress={handleOpen}>
          <Text style={styles.openButtonText}>Open Full Image</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.openButton} onPress={handleOpen}>
        <Text style={styles.openButtonText}>Open Attachment</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginTop: 8 },
  label: { fontSize: 12, color: '#444', marginBottom: 6 },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    backgroundColor: '#f7f7f7'
  },
  openButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#245C9A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8
  },
  openButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 }
});

export default AttachmentPreview;
