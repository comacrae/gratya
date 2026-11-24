/**
 * Envelope encryption per supabase's expo guide.
 * SecureStorage has a storage limit of 2KB and the session key  is roughly 3 KB
 * AsyncStorage can hold any amount of data but anyone can access it.
 * So we encrypt the value using a random key, put the encrypted session into async storage, and put the smaller random key
 * into securestorage.
 */
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as aesjs from "aes-js";
import { createClient } from "@supabase/supabase-js";

const databaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublicKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!databaseUrl) throw new Error("EXPO_PUBLIC_SUPABASE_URL not set");
if (!supabasePublicKey)
  throw new Error("EXPO_PUBLIC_SUPABASE_ANON_KEY not set");

class LargeSecureStore {
  public async setItem(key: string, value: string): Promise<void> {
    // make 32 random byes for AES key
    const keyBytes = crypto.getRandomValues(new Uint8Array(32));
    // encrypt value with new CTR cipher and counter starting at 1
    const encrypted = new aesjs.ModeOfOperation.ctr(
      keyBytes,
      new aesjs.Counter(1),
    ).encrypt(aesjs.utils.utf8.toBytes(value));
    // save the key as hex in secure store and the encrypted bytes as hex in async storage
    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(keyBytes));
    await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(encrypted));
  }

  public async getItem(key: string): Promise<string | null> {
    //get the AES key
    const keyHex = await SecureStore.getItemAsync(key);
    const valueHex = await AsyncStorage.getItem(key);
    // if either null, return null
    if (!keyHex || !valueHex) return null;
    // use the hexKey to decrypt the hex
    const decrypted = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(keyHex),
      new aesjs.Counter(1),
    ).decrypt(aesjs.utils.hex.toBytes(valueHex));
    //convert byte arr to utf-8 string
    return aesjs.utils.utf8.fromBytes(decrypted);
  }

  public async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
    await AsyncStorage.removeItem(key);
  }
}

export const supabase = createClient(databaseUrl, supabasePublicKey, {
  auth: {
    storage: Platform.OS === "web" ? undefined : new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (Platform.OS !== "web")
  AppState.addEventListener("change", (s) =>
    s === "active"
      ? supabase.auth.startAutoRefresh()
      : supabase.auth.stopAutoRefresh(),
  );
