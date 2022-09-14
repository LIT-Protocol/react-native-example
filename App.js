import "node-libs-expo/globals";
import crypto from "msrcrypto";
import { TextEncoder, TextDecoder } from "fastestsmallesttextencoderdecoder";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Button } from "react-native";
import LitJsSdk from "lit-js-sdk-no-wasm";
import { useEffect, useState } from "react";
globalThis.crypto = crypto;

const allSettled = (promises) => {
  return Promise.all(
    promises.map((promise) =>
      promise
        .then((value) => ({ status: "fulfilled", value }))
        .catch((reason) => ({ status: "rejected", reason }))
    )
  );
};

Promise.allSettled = allSettled;

const encryptString = async (str) => {
  const encodedString = LitJsSdk.uint8arrayFromString(str, "utf8");

  const symmKey = await crypto.subtle.generateKey(
    { name: "AES-CBC", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // encrypt the zip with symmetric key
  const iv = crypto.getRandomValues(new Uint8Array(16));

  const encryptedZipData = await crypto.subtle.encrypt(
    {
      name: "AES-CBC",
      iv,
    },
    symmKey,
    encodedString
  );
  const encryptedString = [
    ...Array.from(iv),
    ...Array.from(new Uint8Array(encryptedZipData)),
  ];

  const exportedSymmKey = new Uint8Array(
    await crypto.subtle.exportKey("raw", symmKey)
  );

  return {
    encryptedString,
    symmetricKey: exportedSymmKey,
  };
};

const decryptString = async (encryptedString, symmetricKey) => {
  const importedSymmKey = await crypto.subtle.importKey(
    "raw",
    symmetricKey,
    { name: "AES-CBC", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const recoveredIv = encryptedString.slice(0, 16);

  const encryptedZipArrayBuffer = encryptedString.slice(16);

  let decryptedString = await crypto.subtle.decrypt(
    {
      name: "AES-CBC",
      iv: recoveredIv,
    },
    importedSymmKey,
    encryptedZipArrayBuffer
  );

  decryptedString = LitJsSdk.uint8arrayToString(
    new Uint8Array(decryptedString),
    "utf8"
  );
  return decryptedString;
};

export default function App() {
  const [litNodeClient, setLitNodeClient] = useState(null);
  useEffect(() => {
    const go = async () => {
      const lnc = new LitJsSdk.LitNodeClient({ checkTypes: false });
      await lnc.connect();
      setLitNodeClient(lnc);
    };
    go();
  }, []);
  const go = async () => {
    // const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
    //   "Hello World"
    // );

    const { encryptedString, symmetricKey } = await encryptString(
      "Hello World"
    );

    const authSig = {
      sig: "0x2bdede6164f56a601fc17a8a78327d28b54e87cf3fa20373fca1d73b804566736d76efe2dd79a4627870a50e66e1a9050ca333b6f98d9415d8bca424980611ca1c",
      derivedVia: "web3.eth.personal.sign",
      signedMessage:
        "localhost wants you to sign in with your Ethereum account:\n0x9D1a5EC58232A894eBFcB5e466E3075b23101B89\n\nThis is a key for Partiful\n\nURI: https://localhost/login\nVersion: 1\nChain ID: 1\nNonce: 1LF00rraLO4f7ZSIt\nIssued At: 2022-06-03T05:59:09.959Z",
      address: "0x9D1a5EC58232A894eBFcB5e466E3075b23101B89",
    };

    const accessControlConditions = [
      {
        contractAddress: "",
        standardContractType: "",
        chain: "ethereum",
        method: "eth_getBalance",
        parameters: [":userAddress", "latest"],
        returnValueTest: {
          comparator: ">=",
          value: "0",
        },
      },
    ];

    const chain = "ethereum";

    const encryptedSymmetricKey = await litNodeClient.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain,
    });

    console.log("encryptedSymmetricKey", encryptedSymmetricKey);

    let base16EncryptedSymmetricKey = LitJsSdk.uint8arrayToString(
      encryptedSymmetricKey,
      "base16"
    );

    const decryptedSymmetricKey = await litNodeClient.getEncryptionKey({
      accessControlConditions,
      toDecrypt: base16EncryptedSymmetricKey,
      authSig,
      chain,
    });

    console.log("decryptedSymmetricKey", decryptedSymmetricKey);

    const decryptedString = await decryptString(
      encryptedString,
      decryptedSymmetricKey
    );

    console.log("decryptedString", decryptedString);

    // console.log("decoded: ", decode(decryptedString));
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
