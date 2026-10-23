import { initializeStore, localCollections, localDataDirectory, store } from "./storage/jsonStore.js";

await initializeStore();
const counts = Object.fromEntries(localCollections.map((name) => [name, store.read(name).length]));
console.info(`CareTrack local data is ready at ${localDataDirectory}. Records: ${JSON.stringify(counts)}`);
console.info("Existing records were preserved; demo data is created only when every data file is empty.");
