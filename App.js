import "node-libs-expo/globals";
import crypto from "isomorphic-webcrypto";
import { TextEncoder, TextDecoder } from "fastestsmallesttextencoderdecoder";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Button } from "react-native";
import RNFetchBlob from "react-native-blob-util";
const Blob = RNFetchBlob.polyfill.Blob;
import LitJsSdk from "lit-js-sdk-no-wasm";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    const litNodeClient = new LitJsSdk.LitNodeClient({ checkTypes: false });
  }, []);
  const go = async () => {
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
      "Hello World"
    );
    console.log("encryptedString", encryptedString);
    const blob = Blob.build(encryptedString, {
      type: "application/octet-stream",
    });
    const decryptedString = await LitJsSdk.decryptString(blob, symmetricKey);
    console.log("decryptedString", decryptedString);
  };

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
      <Button title="Press me" onPress={go} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
