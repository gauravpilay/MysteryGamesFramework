// Sample mods data for the marketplace
// Run this script to populate your Firestore database with sample mods

export const sampleMods = [
    {
        title: "The Midnight Mansion Mystery",
        description: "A thrilling murder mystery set in a Victorian mansion. Investigate the death of Lord Blackwood and uncover dark family secrets. Features 8 unique suspects, 15 pieces of evidence, and multiple endings based on your deductions.\n\nIncludes:\n- Fully voice-acted interrogations\n- Custom mansion environment\n- Original soundtrack\n- 3-4 hours of gameplay",
        author: "MysteryMaster",
        authorId: "user123",
        type: "case",
        category: "Murder Mystery",
        tags: ["Victorian", "Mansion", "Murder", "Family Secrets", "Voice Acting"],
        downloads: 1247,
        views: 3521,
        rating: 4.8,
        reviewCount: 89,
        version: "1.2.0",
        compatibility: "1.0.0+",
        thumbnailUrl: "https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=800",
        screenshots: [
            "https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=800",
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
            "https://images.unsplash.com/photo-1516410529446-2c777cb7366d?w=800"
        ],
        featured: true,
        createdAt: new Date('2024-01-15')
    },
    {
        title: "Cyberpunk Detective Pack",
        description: "Transform your game into a neon-soaked cyberpunk thriller! This character pack includes 12 futuristic suspects with unique backstories, cybernetic enhancements, and corporate conspiracies.\n\nFeatures:\n- 12 unique cyberpunk characters\n- Custom neon UI theme\n- Futuristic interrogation scenarios\n- Compatible with all cases",
        author: "NeonNoir",
        authorId: "user456",
        type: "character",
        category: "Character Pack",
        tags: ["Cyberpunk", "Futuristic", "Neon", "Sci-Fi", "Corporate"],
        downloads: 892,
        views: 2103,
        rating: 4.6,
        reviewCount: 54,
        version: "1.0.1",
        compatibility: "1.0.0+",
        thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800",
        screenshots: [
            "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800",
            "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800"
        ],
        featured: true,
        createdAt: new Date('2024-01-20')
    },
    {
        title: "Dark Mode Pro Theme",
        description: "A sleek, professional dark theme with enhanced contrast and readability. Perfect for late-night detective work!\n\nIncludes:\n- Custom color palette\n- Enhanced UI elements\n- Smooth animations\n- Eye-friendly design",
        author: "UIWizard",
        authorId: "user789",
        type: "theme",
        category: "UI Theme",
        tags: ["Dark Mode", "Professional", "Modern", "Sleek"],
        downloads: 2341,
        views: 5672,
        rating: 4.9,
        reviewCount: 156,
        version: "2.0.0",
        compatibility: "1.0.0+",
        thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
        screenshots: [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"
        ],
        featured: false,
        createdAt: new Date('2024-02-01')
    },
    {
        title: "The Poisoned Chalice",
        description: "A medieval mystery in a royal court. The king has been poisoned, and you must find the culprit before they strike again!\n\nFeatures:\n- Medieval setting\n- 6 royal suspects\n- Alchemy and poison mechanics\n- Historical accuracy",
        author: "HistoryBuff",
        authorId: "user321",
        type: "case",
        category: "Historical Mystery",
        tags: ["Medieval", "Royalty", "Poison", "Historical", "Court Intrigue"],
        downloads: 567,
        views: 1432,
        rating: 4.5,
        reviewCount: 34,
        version: "1.0.0",
        compatibility: "1.0.0+",
        thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
        screenshots: [
            "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800"
        ],
        featured: false,
        createdAt: new Date('2024-01-25')
    },
    {
        title: "Advanced Deduction System",
        description: "Enhance your detective skills with this advanced deduction plugin! Adds new mechanics for connecting clues, timeline analysis, and motive mapping.\n\nFeatures:\n- Visual clue board\n- Timeline reconstruction\n- Motive analyzer\n- Contradiction detector",
        author: "CodeDetective",
        authorId: "user654",
        type: "plugin",
        category: "Gameplay Enhancement",
        tags: ["Deduction", "Mechanics", "Analysis", "Tools"],
        downloads: 1523,
        views: 3890,
        rating: 4.7,
        reviewCount: 98,
        version: "1.5.0",
        compatibility: "1.0.0+",
        thumbnailUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800",
        screenshots: [
            "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800"
        ],
        featured: true,
        createdAt: new Date('2024-01-10')
    },
    {
        title: "Film Noir Collection",
        description: "Classic 1940s detective cases with authentic noir atmosphere. Three complete cases featuring hard-boiled detectives, femme fatales, and corrupt officials.\n\nIncludes:\n- 3 complete noir cases\n- Black & white filter option\n- Period-accurate dialogue\n- Jazz soundtrack",
        author: "NoirFan",
        authorId: "user987",
        type: "case",
        category: "Noir Mystery",
        tags: ["Film Noir", "1940s", "Classic", "Detective", "Jazz"],
        downloads: 789,
        views: 2156,
        rating: 4.8,
        reviewCount: 67,
        version: "1.1.0",
        compatibility: "1.0.0+",
        thumbnailUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800",
        screenshots: [
            "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800"
        ],
        featured: true,
        createdAt: new Date('2024-01-18')
    },
    {
        title: "Anime Detective Characters",
        description: "Bring anime-style characters to your investigations! 10 beautifully illustrated suspects with anime aesthetics and personality quirks.\n\nFeatures:\n- 10 anime-style characters\n- Custom artwork\n- Unique personality traits\n- Japanese name options",
        author: "AnimeArtist",
        authorId: "user246",
        type: "character",
        category: "Character Pack",
        tags: ["Anime", "Manga", "Japanese", "Illustrated"],
        downloads: 1876,
        views: 4523,
        rating: 4.4,
        reviewCount: 112,
        version: "1.0.0",
        compatibility: "1.0.0+",
        thumbnailUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800",
        screenshots: [
            "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800"
        ],
        featured: false,
        createdAt: new Date('2024-01-28')
    },
    {
        title: "Minimalist UI Theme",
        description: "Clean, distraction-free interface for focused investigation. Removes clutter and emphasizes important information.\n\nFeatures:\n- Minimalist design\n- Improved readability\n- Faster load times\n- Mobile-optimized",
        author: "MinimalDesign",
        authorId: "user135",
        type: "theme",
        category: "UI Theme",
        tags: ["Minimalist", "Clean", "Simple", "Fast"],
        downloads: 1234,
        views: 3012,
        rating: 4.6,
        reviewCount: 78,
        version: "1.0.2",
        compatibility: "1.0.0+",
        thumbnailUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800",
        screenshots: [
            "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800"
        ],
        featured: false,
        createdAt: new Date('2024-02-03')
    }
];

// Function to add sample mods to Firestore
export async function populateSampleMods(db) {
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');

    console.log('Populating sample mods...');

    for (const mod of sampleMods) {
        try {
            const modData = {
                ...mod,
                createdAt: Timestamp.fromDate(mod.createdAt),
                updatedAt: Timestamp.now()
            };

            const docRef = await addDoc(collection(db, 'marketplace_mods'), modData);
            console.log(`Added mod: ${mod.title} (ID: ${docRef.id})`);
        } catch (error) {
            console.error(`Error adding mod ${mod.title}:`, error);
        }
    }

    console.log('Sample mods populated successfully!');
}
