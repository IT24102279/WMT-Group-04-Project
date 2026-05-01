import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { FileText, Image as ImageIcon, ExternalLink } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../utils/theme';
import { showToast } from '../utils/toast';

const isPdfUrl = (url) => /\.pdf($|\?)/i.test(url) || url?.includes('/pdf');
const isImageUrl = (url) => /\.(png|jpe?g|gif|webp)($|\?)/i.test(url) || url?.includes('/image');

const AttachmentPreview = ({ url, imageLabel = 'Image Attachment', pdfLabel = 'Document' }) => {
  if (!url) return null;

  const handleOpen = async () => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        showToast('Cannot open attachment');
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      showToast('Error opening attachment');
    }
  };

  if (isPdfUrl(url)) {
    return (
      <Pressable style={styles.container} onPress={handleOpen}>
        <View style={styles.pdfCard}>
          <View style={styles.iconCircle}>
            <FileText size={20} color={COLORS.error} />
          </View>
          <View style={styles.textInfo}>
            <Text style={styles.fileName}>{pdfLabel}</Text>
            <Text style={styles.fileType}>PDF Document</Text>
          </View>
          <ExternalLink size={16} color={COLORS.textLight} />
        </View>
      </Pressable>
    );
  }

  // Treat as image by default or if detected
  return (
    <Pressable style={styles.container} onPress={handleOpen}>
      <View style={styles.imageCard}>
        <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
        <View style={styles.overlay}>
          <ImageIcon size={16} color={COLORS.white} />
          <Text style={styles.overlayText}>{imageLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
    width: '100%',
  },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  textInfo: {
    flex: 1,
  },
  fileName: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
  },
  fileType: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  imageCard: {
    height: 160,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overlayText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default AttachmentPreview;
