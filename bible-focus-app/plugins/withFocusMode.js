const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

const withFocusMode = (config) =>
  withAndroidManifest(config, (manifestConfig) => {
    AndroidConfig.Permissions.addPermission(
      manifestConfig.modResults,
      "android.permission.ACCESS_NOTIFICATION_POLICY"
    );
    AndroidConfig.Permissions.addPermission(manifestConfig.modResults, "android.permission.POST_NOTIFICATIONS");
    return manifestConfig;
  });

module.exports = withFocusMode;
