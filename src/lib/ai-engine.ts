import { supabase } from './supabase';
import type {
  GeneratedContentConfig,
  BuildSceneConfig,
  VerseQuestConfig,
  ExploreAdventureConfig,
  HeroCardConfig,
  TeamMissionConfig,
  HeroRarity,
} from './database.types';

/**
 * Pastor input for AI content generation (7 data points)
 */
export interface PastorInput {
  campusId: string;
  weekOf: string; // ISO date
  theme: string;
  virtue: string;
  bibleStoryTitle: string;
  bibleStoryReference: string;
  bibleStorySummary: string;
  memoryVerseText: string;
  memoryVerseReference: string;
  bottomLine: string;
  application: string;
}

/**
 * Deterministic template-based content generation
 * Creates varied content based on pastor inputs
 */
function generateBuildScene(input: PastorInput): BuildSceneConfig {
  const locations = [
    'Valley of Courage',
    'Temple of Faith',
    'Mount of Strength',
    'River of Hope',
    'Desert of Trust',
  ];
  const backgrounds = ['🌅', '🏜️', '🏔️', '🌳', '🌲'];

  const locationIdx = input.theme.charCodeAt(0) % locations.length;
  const bgIdx = input.virtue.charCodeAt(0) % backgrounds.length;

  const pieces = [
    { emoji: '🧱', name: 'Foundation', position: 'bottom-left', order: 1 },
    { emoji: '🏛️', name: 'Structure', position: 'center', order: 2 },
    { emoji: '📯', name: 'Banner', position: 'top', order: 3 },
    { emoji: '⚔️', name: 'Symbol', position: 'center-right', order: 4 },
    { emoji: '🛡️', name: 'Shield', position: 'left', order: 5 },
    { emoji: '👑', name: 'Crown', position: 'center-top', order: 6 },
  ];

  return {
    scene_id: `scene_${input.theme.toLowerCase().replace(/\s+/g, '_')}`,
    background: backgrounds[bgIdx],
    pieces: pieces.map((p) => ({
      emoji: p.emoji,
      name: p.name,
      position: p.position,
      order: p.order,
    })),
    completion_narration: `You've built the ${locations[locationIdx]} with ${input.virtue}! ${input.bottomLine}`,
    verse_reveal: {
      reference: input.memoryVerseReference,
      text: input.memoryVerseText,
    },
  };
}

function generateVerseQuest(input: PastorInput): VerseQuestConfig {
  const words = input.memoryVerseText.split(/\s+/);
  const hiddenCount = Math.min(Math.ceil(words.length * 0.35), 5);
  const hiddenIndices: number[] = [];

  // Select hidden word indices deterministically
  const step = Math.max(1, Math.floor(words.length / hiddenCount));
  for (let i = 0; i < hiddenCount && i * step < words.length; i++) {
    hiddenIndices.push(i * step);
  }

  const hiddenWords = hiddenIndices.map((i) => words[i]);

  return {
    verse: input.memoryVerseText,
    reference: input.memoryVerseReference,
    rounds: [
      {
        type: 'full_display',
        mode: 'tap_along',
      },
      {
        type: 'blanks',
        hidden_words: hiddenWords,
        visible_words: words.filter((_, i) => !hiddenIndices.includes(i)),
        choices_include_distractors: true,
      },
      {
        type: 'mostly_hidden',
        hidden_words: words,
        choices_include_distractors: true,
      },
      {
        type: 'full_recall',
        mode: 'voice_or_type',
      },
    ],
  };
}

function generateExploreAdventure(input: PastorInput): ExploreAdventureConfig {
  const scenes = [
    {
      narration: `You encounter a challenge: ${input.theme}. What do you do?`,
      choices: [
        {
          text: `Trust in ${input.virtue}`,
          virtue: input.virtue,
          advances: true,
          teaches: input.bottomLine,
        },
        {
          text: 'Doubt and fear',
          virtue: undefined,
          advances: false,
          teaches: 'Without faith, we stumble',
        },
        {
          text: `Remember: "${input.memoryVerseText.substring(0, 30)}..."`,
          is_scripture: true,
          ref: input.memoryVerseReference,
          advances: true,
          teaches: input.application,
        },
      ],
    },
    {
      narration: `${input.bibleStoryTitle}: A moment of decision. The story of ${input.virtue} unfolds.`,
      choices: [
        {
          text: 'Act with courage',
          virtue: input.virtue,
          advances: true,
          teaches: input.bottomLine,
        },
        {
          text: 'Hesitate and wait',
          virtue: undefined,
          advances: false,
          teaches: 'Wait for the right moment',
        },
        {
          text: 'Pray for guidance',
          is_scripture: true,
          advances: true,
          teaches: 'God guides the faithful',
        },
      ],
    },
    {
      narration: `The final test. How will you apply ${input.application}?`,
      choices: [
        {
          text: 'Use this lesson in your life',
          virtue: input.virtue,
          advances: true,
          teaches: input.application,
        },
        {
          text: 'Forget what you learned',
          virtue: undefined,
          advances: false,
          teaches: 'Knowledge without action is empty',
        },
        {
          text: 'Share with others',
          virtue: input.virtue,
          advances: true,
          teaches: 'Faith grows when shared',
        },
      ],
    },
  ];

  return {
    story_id: `adventure_${input.theme.toLowerCase().replace(/\s+/g, '_')}`,
    scenes,
    conclusion: `You've learned about ${input.virtue}. Remember: ${input.bottomLine}`,
  };
}

function determineRarity(virtue: string): HeroRarity {
  const rarities: HeroRarity[] = ['common', 'rare', 'epic', 'legendary'];
  const hash = virtue.charCodeAt(0) + virtue.charCodeAt(virtue.length - 1);
  return rarities[hash % rarities.length];
}

function generateHeroCard(input: PastorInput): HeroCardConfig {
  return {
    hero: input.theme,
    title: input.theme,
    virtue: input.virtue,
    power: `Power of ${input.virtue}`,
    verse: input.memoryVerseText,
    story_summary: input.bibleStorySummary,
    rarity: determineRarity(input.virtue),
    art_prompt: `A biblical hero displaying ${input.virtue}, inspired by ${input.bibleStoryTitle}. Minecraft style, heroic pose, glowing aura.`,
  };
}

function generateTeamMission(input: PastorInput): TeamMissionConfig {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);

  return {
    mission_title: `The ${input.virtue} Challenge`,
    description: `Work together as a team to complete this week's challenges. ${input.bottomLine}`,
    goals: {
      builds_completed: 15,
      verses_memorized: 5,
      adventures_finished: 3,
    },
    reward: `Unlock the story of ${input.theme}`,
    deadline: deadline.toISOString(),
  };
}

/**
 * Generate a complete week of gamified content from pastor inputs
 * Saves to Supabase and returns the generated content
 */
export async function generateWeeklyContent(input: PastorInput) {
  try {
    // Generate all content components
    const buildScene = generateBuildScene(input);
    const verseQuest = generateVerseQuest(input);
    const exploreAdventure = generateExploreAdventure(input);
    const heroCard = generateHeroCard(input);
    const teamMission = generateTeamMission(input);

    const generatedConfig: GeneratedContentConfig = {
      build_scene: buildScene,
      verse_quest: verseQuest,
      explore_adventure: exploreAdventure,
      hero_card: heroCard,
      team_mission: teamMission,
      narration_scripts: {
        build_intro: `Build the ${buildScene.scene_id} with ${input.virtue}!`,
        verse_intro: `Memorize ${input.memoryVerseReference}`,
        adventure_intro: `Begin your adventure: ${input.bibleStoryTitle}`,
        completion: `You've completed this week's content!`,
      },
      parent_summary: {
        theme: input.theme,
        virtue: input.virtue,
        story: input.bibleStoryTitle,
        conversation_starters: [
          `What does ${input.virtue} mean to you?`,
          `How is this week's story like your life?`,
          `When do you need ${input.application}?`,
        ],
      },
    };

    // Create weekly_content record
    const { data: weeklyData, error: weeklyError } = await supabase
      .from('weekly_content')
      .insert({
        campus_id: input.campusId,
        week_start: input.weekOf,
        theme: input.theme,
        virtue: input.virtue,
        bible_story_title: input.bibleStoryTitle,
        bible_story_reference: input.bibleStoryReference,
        bible_story_summary: input.bibleStorySummary,
        memory_verse_text: input.memoryVerseText,
        memory_verse_reference: input.memoryVerseReference,
        bottom_line: input.bottomLine,
        application: input.application,
        generated_content: generatedConfig,
        status: 'draft',
      })
      .select()
      .single();

    if (weeklyError) throw weeklyError;

    // Create generated_content record
    const { data: generatedData, error: generatedError } = await supabase
      .from('generated_content')
      .insert({
        weekly_content_id: weeklyData.id,
        build_scene_config: buildScene,
        verse_quest_config: verseQuest,
        explore_adventure_config: exploreAdventure,
        hero_card_config: heroCard,
        team_mission_config: teamMission,
        narration_scripts: generatedConfig.narration_scripts,
        parent_summary: generatedConfig.parent_summary,
      })
      .select()
      .single();

    if (generatedError) throw generatedError;

    return {
      success: true,
      weeklyContent: weeklyData,
      generatedContent: generatedData,
    };
  } catch (error) {
    console.error('Error generating weekly content:', error);
    throw error;
  }
}

/**
 * Approve and publish weekly content to all affected players
 */
export async function publishWeeklyContent(weeklyContentId: string) {
  try {
    const { data, error } = await supabase
      .from('weekly_content')
      .update({ status: 'published' })
      .eq('id', weeklyContentId)
      .select()
      .single();

    if (error) throw error;

    console.log('Content published:', data);
    return data;
  } catch (error) {
    console.error('Error publishing content:', error);
    throw error;
  }
}
