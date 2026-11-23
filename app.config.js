
export default ({ config }) => ({
    ...config,
    plugins: [
        ...(config.plugins ?? []),
        [
            'expo-location',
            {
                locationWhenInUsePermission:
                    'Civic Pulse membutuhkan lokasi Anda untuk menampilkan posisi pada peta.',
            },
        ],
        [
            'react-native-maps',
            {
                androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
            },
        ],
    ],
});
