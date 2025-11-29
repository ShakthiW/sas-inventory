import { getAuth } from "./src/lib/better-auth/auth";

async function main() {
  try {
    const auth = await getAuth();
    console.log("Keys of auth:", Object.keys(auth));
    // @ts-ignore
    if (auth.api) {
        // @ts-ignore
      console.log("Keys of auth.api:", Object.keys(auth.api));
    }
  } catch (error) {
    console.error(error);
  }
  process.exit(0);
}

main();
