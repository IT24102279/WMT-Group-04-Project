export const buildMultipartForm = (payload = {}, fileField, fileAsset) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value) || typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  if (fileField && fileAsset?.uri) {
    formData.append(fileField, {
      uri: fileAsset.uri,
      name: fileAsset.name || `${fileField}-${Date.now()}`,
      type: fileAsset.mimeType || 'application/octet-stream'
    });
  }

  return formData;
};
