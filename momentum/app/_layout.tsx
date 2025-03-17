import { Stack, Redirect } from "expo-router";

export default function RootLayout() {
  return (
    <>
      <Redirect href="/home" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login/index" />
        <Stack.Screen name="signup/index" />
        <Stack.Screen name="home/index" />
      </Stack>
    </>
  );
}
