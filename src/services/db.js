import { 
  getFirestoreDb, 
  isFirebaseConfigured, 
  saveFirebaseConfig, 
  clearFirebaseConfig, 
  testFirebaseConnection, 
  getFirebaseConfig 
} from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';

const DB_NAME = 'ChronicleNewsDB';
const DB_VERSION = 1;

// Base IndexedDB Initializer
export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database failed to open:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store for articles
      if (!db.objectStoreNames.contains('articles')) {
        db.createObjectStore('articles', { keyPath: 'id' });
      }

      // Store for videos
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos', { keyPath: 'id' });
      }
    };
  });
}

// Helper to wrap transactions in Promises
function getStore(storeName, mode = 'readonly') {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      resolve({ store, transaction });
    });
  });
}

// Local IndexedDB CRUD primitives
const localDB = {
  async getArticles() {
    const { store } = await getStore('articles', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async addArticle(article) {
    const { store } = await getStore('articles', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(article);
      request.onsuccess = () => resolve(article);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteArticle(id) {
    const { store } = await getStore('articles', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  },

  async getVideos() {
    const { store } = await getStore('videos', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async addVideo(video) {
    const { store } = await getStore('videos', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(video);
      request.onsuccess = () => resolve(video);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteVideo(id) {
    const { store } = await getStore('videos', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }
};

export const dbService = {
  isCloudActive() {
    return isFirebaseConfigured() && Boolean(getFirestoreDb());
  },

  getCloudConfig() {
    return getFirebaseConfig();
  },

  saveCloudConfig(config) {
    return saveFirebaseConfig(config);
  },

  clearCloudConfig() {
    return clearFirebaseConfig();
  },

  testCloudConnection(config) {
    return testFirebaseConnection(config);
  },

  // Real-time articles listener
  subscribeArticles(onUpdate, onError) {
    const firestore = getFirestoreDb();
    if (firestore && isFirebaseConfigured()) {
      try {
        const q = query(collection(firestore, 'articles'));
        return onSnapshot(
          q,
          async (snapshot) => {
            const list = [];
            const cloudIds = new Set();
            snapshot.forEach((doc) => {
              const data = { id: doc.id, ...doc.data() };
              list.push(data);
              cloudIds.add(doc.id);
            });
            // Update local IndexedDB cache in background
            list.forEach((art) => localDB.addArticle(art).catch(() => {}));
            // Clean up locally deleted items that are no longer in Firestore
            if (cloudIds.size > 0) {
              const localArticles = await localDB.getArticles().catch(() => []);
              for (const loc of localArticles) {
                if (!cloudIds.has(loc.id)) {
                  await localDB.deleteArticle(loc.id).catch(() => {});
                }
              }
            }
            onUpdate(list);
          },
          (error) => {
            console.warn('Firestore articles subscription error, falling back:', error);
            if (onError) onError(error);
          }
        );
      } catch (e) {
        console.warn('Could not establish Firestore subscription:', e);
      }
    }
    return () => {};
  },

  // Real-time videos listener
  subscribeVideos(onUpdate, onError) {
    const firestore = getFirestoreDb();
    if (firestore && isFirebaseConfigured()) {
      try {
        const q = query(collection(firestore, 'videos'));
        return onSnapshot(
          q,
          async (snapshot) => {
            const list = [];
            const cloudIds = new Set();
            snapshot.forEach((doc) => {
              const data = { id: doc.id, ...doc.data() };
              list.push(data);
              cloudIds.add(doc.id);
            });
            // Update local IndexedDB cache in background
            list.forEach((vid) => localDB.addVideo(vid).catch(() => {}));
            if (cloudIds.size > 0) {
              const localVideos = await localDB.getVideos().catch(() => []);
              for (const loc of localVideos) {
                if (!cloudIds.has(loc.id)) {
                  await localDB.deleteVideo(loc.id).catch(() => {});
                }
              }
            }
            onUpdate(list);
          },
          (error) => {
            console.warn('Firestore videos subscription error, falling back:', error);
            if (onError) onError(error);
          }
        );
      } catch (e) {
        console.warn('Could not establish Firestore subscription:', e);
      }
    }
    return () => {};
  },

  getLocalArticles() {
    return localDB.getArticles();
  },

  getLocalVideos() {
    return localDB.getVideos();
  },

  // Articles CRUD
  async getArticles() {
    const firestore = getFirestoreDb();
    if (firestore && isFirebaseConfigured()) {
      try {
        const fetchPromise = getDocs(collection(firestore, 'articles'));
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firestore read timeout')), 2500)
        );
        const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
        const cloudArticles = [];
        snapshot.forEach((doc) => {
          cloudArticles.push({ id: doc.id, ...doc.data() });
        });
        if (cloudArticles.length > 0) {
          // Cache to IndexedDB in background
          cloudArticles.forEach((art) => localDB.addArticle(art).catch(() => {}));
          return cloudArticles;
        }
      } catch (err) {
        console.warn('Failed or timed out fetching articles from Firestore, reading local cache:', err.message || err);
      }
    }
    return localDB.getArticles();
  },

  async addArticle(article) {
    // Save to local cache first
    await localDB.addArticle(article);

    const firestore = getFirestoreDb();
    if (firestore && isFirebaseConfigured()) {
      setDoc(doc(firestore, 'articles', String(article.id)), article).catch((err) => {
        console.warn('Background Firestore article write note:', err.message || err);
      });
    }
    return article;
  },

  async updateArticle(article) {
    return this.addArticle(article);
  },

  async deleteArticle(id) {
    await localDB.deleteArticle(id);

    const firestore = getFirestoreDb();
    if (firestore && isFirebaseConfigured()) {
      deleteDoc(doc(firestore, 'articles', String(id))).catch((err) => {
        console.warn('Background Firestore article delete note:', err.message || err);
      });
    }
    return id;
  },

  // Videos CRUD
  async getVideos() {
    const firestore = getFirestoreDb();
    if (firestore && isFirebaseConfigured()) {
      try {
        const fetchPromise = getDocs(collection(firestore, 'videos'));
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firestore read timeout')), 2500)
        );
        const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
        const cloudVideos = [];
        snapshot.forEach((doc) => {
          cloudVideos.push({ id: doc.id, ...doc.data() });
        });
        if (cloudVideos.length > 0) {
          cloudVideos.forEach((vid) => localDB.addVideo(vid).catch(() => {}));
          return cloudVideos;
        }
      } catch (err) {
        console.warn('Failed or timed out fetching videos from Firestore, reading local cache:', err.message || err);
      }
    }
    return localDB.getVideos();
  },

  async addVideo(video) {
    await localDB.addVideo(video);

    const firestore = getFirestoreDb();
    if (firestore && isFirebaseConfigured()) {
      setDoc(doc(firestore, 'videos', String(video.id)), video).catch((err) => {
        console.warn('Background Firestore video write note:', err.message || err);
      });
    }
    return video;
  },

  async updateVideo(video) {
    return this.addVideo(video);
  },

  async deleteVideo(id) {
    await localDB.deleteVideo(id);

    const firestore = getFirestoreDb();
    if (firestore && isFirebaseConfigured()) {
      deleteDoc(doc(firestore, 'videos', String(id))).catch((err) => {
        console.warn('Background Firestore video delete note:', err.message || err);
      });
    }
    return id;
  },

  // Sync all local articles and videos to Cloud Firestore
  async syncLocalToCloud() {
    const firestore = getFirestoreDb();
    if (!firestore || !isFirebaseConfigured()) {
      throw new Error('Firebase Firestore is not configured or connected.');
    }

    const localArticles = await localDB.getArticles();
    const localVideos = await localDB.getVideos();

    let uploadedArticles = 0;
    let uploadedVideos = 0;

    for (const art of localArticles) {
      await setDoc(doc(firestore, 'articles', String(art.id)), art);
      uploadedArticles++;
    }

    for (const vid of localVideos) {
      await setDoc(doc(firestore, 'videos', String(vid.id)), vid);
      uploadedVideos++;
    }

    return { uploadedArticles, uploadedVideos };
  },

  // Database Seed Mock Data
  async seedIfEmpty() {
    // Respect user deletions: only seed if the database has NEVER been initialized
    const alreadySeeded = localStorage.getItem('chronicle_db_seeded');
    if (alreadySeeded) {
      return;
    }

    const existingArticles = await localDB.getArticles();
    const existingVideos = await localDB.getVideos();

    if (existingArticles.length > 0 || existingVideos.length > 0) {
      localStorage.setItem('chronicle_db_seeded', 'true');
      return;
    }

    const mockArticles = [
      {
        id: 'art-1',
        title: 'Quantum Leap: Silicon Qubits Reach 99.9% Fidelity in Room-Temperature Test',
        summary: 'A consortium of computational physicists has proven quantum gate coherence at near-ambient temperatures, opening the floodgates for commercial integration.',
        category: 'tech',
        image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
        body: `Computational technology has hit an inflection point. Researchers at the Geneva Institute of Technology have achieved 99.9% fidelity in two-qubit operations using standard silicon-based quantum devices at near-ambient temperatures (approximately 15 degrees Celsius). Previously, sub-Kelvin refrigeration was mandatory to shield fragile qubits from heat-induced environmental decoherence.

This breakthrough addresses one of quantum computing's steepest economic bottlenecks: the massive power cost of liquid helium dilution refrigerators. By utilizing custom-engineered silicon-vacancy channels, the team successfully suppressed phase errors that usually cripple Room-Temperature operation.

Dr. Elena Rostova, Director of Research, commented: "This is the 'transistor moment' for quantum computation. By showing that silicon qubits can operate reliably without refrigeration stacks larger than a sedan, we are paving the clear path toward rack-mounted quantum accelerators running alongside conventional high-performance supercomputers in typical enterprise datacenters."

Commercial deployment is expected within the next 3 to 5 years, with financial and pharmaceutical simulations tipped to reap immediate computational performance boosts.`,
        author: 'Sarah Jenkins',
        date: '2026-08-23T14:30:00Z',
        views: 1240,
        readTime: 4
      },
      {
        id: 'art-2',
        title: 'The Geneva Hydrogen Accord: 120 Nations Form Decarbonization Alliance',
        summary: 'In an unprecedented multilateral effort, global economic leaders commit $450B in direct subsidies to establish global green hydrogen logistics by 2030.',
        category: 'world',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        body: `The final session of the UN Decarbonization Forum ended with the historic signing of the Geneva Hydrogen Accord. A coalition of 120 countries has formally ratified a treaty to construct a synchronized global distribution network for green hydrogen—hydrogen produced using entirely renewable energy sources like wind and solar.

The treaty establishes a centralized subsidy pool totaling $450 Billion, intended to fund the expansion of heavy-industry water electrolysis facilities and the conversion of existing trans-national natural gas pipelines.

Key elements of the treaty include:
1. Harmonized international standards for hydrogen purity.
2. Complete tax-exempt status for green hydrogen imports in participating European and Asian hubs.
3. Matching research grants for retrofitting commercial container ships to run on ammonia-hydrogen fuels.

Critics, however, raise concerns that carbon-capture 'blue' hydrogen (derived from natural gas with carbon storage) is still allowed as a transitional fuel under the treaty, which some environmental groups claim could serve as a loophole for oil-producing nations. Nonetheless, the accord represents the single most significant financial treaty signed in defense of clean grid transitions in over a decade.`,
        author: 'Michael Vance',
        date: '2026-08-24T09:15:00Z',
        views: 890,
        readTime: 3
      },
      {
        id: 'art-3',
        title: 'Indie Phenomenon "Aether Void" Wins Triple Crown at Game Developers Summit',
        summary: 'Developed by a team of just three creators, the atmospheric mystery game clinched Game of the Year, Narrative Design, and Best Art Direction.',
        category: 'entertainment',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
        body: `It was a night of pure jubilation for independent game developers worldwide. At the annual Game Developers Summit in San Francisco, the atmospheric sci-fi detective title "Aether Void" swept the evening's primary honors, winning Game of the Year, Best Narrative, and Outstanding Art Direction.

What makes this victory remarkable is that the game was conceptualized and completed entirely by a three-person studio operating out of a rented flat in Zagreb, Croatia, with a total budget that wouldn't cover the marketing costs of a single AAA shooter's launch weekend.

"Aether Void" utilizes a unique, high-contrast voxel aesthetic accompanied by an dynamic, generative retro synth soundtrack. The player navigates a derelict oceanic space station using only acoustic sonar and translated logs, solving an intricate corporate espionage narrative.

"We wanted to build something that respects player intellect and prioritizes visual restraint," said Lead Designer Ivan Novak during his acceptance speech. "Winning this is proof that the industry is still driven by core artistic concepts, not just massive render farms and predatory monetization systems."

The game has surpassed 4.2 million copies sold across PC and consoles, illustrating that player appetite for experimental storytelling remains incredibly strong.`,
        author: 'Chloe Dupont',
        date: '2026-08-22T18:45:00Z',
        views: 2450,
        readTime: 5
      },
      {
        id: 'art-4',
        title: 'Venture Capital Refocuses on Biotech as SaaS Multiples Standardize',
        summary: 'Silicon Valley investment portfolios show a notable shift from enterprise SaaS towards molecular diagnostic platforms and longevity research.',
        category: 'business',
        image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80',
        body: `As corporate software multiples revert to pre-pandemic baselines, major Silicon Valley investment funds are shifting their capital toward biotech, deep tech, and automated medicine platforms.

According to a quarterly report released by Sand Hill Insights, institutional venture capital deployment into SaaS startups dropped 35% year-on-year. In contrast, investments in automated biology labs, precision oncology diagnostics, and synthetic biology applications rose by a combined 48%.

This shift is driven in part by the maturation of generative AI models applied to protein folding and structural drug design, drastically shortening the R&D cycle from years to weeks.

Venture Capital partner Marcus Thorne explained: "For a decade, we funded software models that optimized simple business logistics. Now, the real alpha is found in hard science. We are seeing platforms that can predict drug efficacy before clinical trials even begin. That represents a fundamental change in human health economics."

While biotech remains a capital-intensive sector with high regulatory risks (FDA pipelines), investors appear willing to trade immediate software margin profiles for the massive, long-term returns of therapeutic breakthroughs.`,
        author: 'David Chen',
        date: '2026-08-21T11:00:00Z',
        views: 620,
        readTime: 4
      }
    ];

    for (const art of mockArticles) {
      await localDB.addArticle(art);
    }

    for (const vid of mockVideos) {
      await localDB.addVideo(vid);
    }

    localStorage.setItem('chronicle_db_seeded', 'true');
  }
};

