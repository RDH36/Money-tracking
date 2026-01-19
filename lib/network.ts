import * as Network from 'expo-network';

export async function checkInternetConnection(): Promise<boolean> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isConnected === true && networkState.isInternetReachable === true;
  } catch {
    return false;
  }
}
