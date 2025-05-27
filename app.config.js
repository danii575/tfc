const isWeb = process.env.EXPO_PLATFORM === 'web';

export default ({ config }) => {
  return {
    ...config,
    plugins: isWeb
      ? [] // No incluir plugins nativos en la web
      : [

          [
            'expo-build-properties',
            {
              ios: {
                useFrameworks: 'static',
              },
            },
          ],
        ],
  };
};
