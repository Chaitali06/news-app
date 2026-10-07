const DB_NAME = 'ChronicleNewsDB';
const DB_VERSION = 1;

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

export const dbService = {
  // Articles CRUD
  async getArticles() {
    const { store } = await getStore('articles', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async addArticle(article) {
    const { store } = await getStore('articles', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(article);
      request.onsuccess = () => resolve(article);
      request.onerror = () => reject(request.error);
    });
  },

  async updateArticle(article) {
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

  // Videos CRUD
  async getVideos() {
    const { store } = await getStore('videos', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async addVideo(video) {
    const { store } = await getStore('videos', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(video);
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
  },

  // Database Seed Mock Data
  async seedIfEmpty() {
    const articles = await this.getArticles();
    const videos = await this.getVideos();

    if (articles.length === 0) {
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
        await this.addArticle(art);
      }
    }

    if (videos.length === 0) {
      const mockVideos = [
        {
          id: 'vid-1',
          title: 'Special Report: The Global Green Hydrogen Logistics Race',
          description: 'A deep-dive investigation into the infrastructure required to replace coal and gas pipelines with clean green hydrogen, focusing on the newly signed Geneva Accord.',
          category: 'world',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=800&q=80',
          author: 'Chronicle Investigative Team',
          date: '2026-08-24T09:30:00Z',
          views: 4500,
          duration: '0:15'
        },
        {
          id: 'vid-2',
          title: 'Chronicle Tech Tour: Inside the Geneva Silicon Qubit Lab',
          description: 'Our tech editors tour the research labs that achieved room-temperature quantum calculations. We interview Dr. Elena Rostova and watch the system run.',
          category: 'tech',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
          author: 'Sarah Jenkins',
          date: '2026-08-23T15:00:00Z',
          views: 9200,
          duration: '0:15'
        },
        {
          id: 'vid-3',
          title: 'Aether Void Official GDS Cinematic Showcase',
          description: 'Catch the gameplay trailer of Aether Void, the voxel space detective adventure that shocked the gaming world by sweeping the GDS Awards.',
          category: 'entertainment',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
          author: 'GDS Editorial',
          date: '2026-08-22T19:00:00Z',
          views: 15400,
          duration: '12:14'
        }
      ];

      for (const vid of mockVideos) {
        await this.addVideo(vid);
      }
    }
  }
};
