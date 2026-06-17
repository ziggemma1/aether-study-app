import ShopItem from '../models/ShopItem';

export async function seedShop() {
  const count = await ShopItem.countDocuments();
  if (count > 0) return;

  const items = [
    {
      name: 'Streak Freeze',
      description: 'Guilt-free day off. Keeps your streak active even if you miss a day.',
      category: 'utility',
      price: 100,
      type: 'consumable',
      icon: '❄️',
      metadata: { type: 'streak-freeze' }
    },
    {
      name: 'Cyberpunk Red',
      description: 'Neon-infused crimson interface for late-night study sessions.',
      category: 'theme',
      price: 250,
      type: 'one-time',
      icon: '🔴',
      metadata: { themeId: 'cyberpunk-red' }
    },
    {
      name: 'Ocean Breeze',
      description: 'Calming blue gradients to keep your mind fresh and cool.',
      category: 'theme',
      price: 200,
      type: 'one-time',
      icon: '🌊',
      metadata: { themeId: 'ocean-breeze' }
    },
    {
      name: 'Voice: Atlas',
      description: 'Deep, resonant UK English voice for your study companion.',
      category: 'voice',
      price: 500,
      type: 'one-time',
      icon: '🎙️',
      metadata: { voiceId: 'atlas' }
    },
    {
      name: 'Voice: Nova',
      description: 'Bright and energetic US English voice to keep you motivated.',
      category: 'voice',
      price: 350,
      type: 'one-time',
      icon: '🎙️',
      metadata: { voiceId: 'nova' }
    },
    {
      name: 'Scholar Badge',
      description: 'A prestigious badge displayed on your profile and leaderboard rank.',
      category: 'badge',
      price: 1000,
      type: 'permanent',
      icon: '🏅'
    }
  ];

  await ShopItem.insertMany(items);
  console.log('✅ Shop seeded with initial items');
}
