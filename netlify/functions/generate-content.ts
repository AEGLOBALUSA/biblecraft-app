import Anthropic from '@anthropic-ai/sdk';
import type {
  BuildSceneConfig,
  VerseQuestConfig,
  ExploreAdventureConfig,
  HeroCardConfig,
  TeamMissionConfig,
} from '../../src/lib/database.types';

interface PastorInput {
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

interface GeneratedContent {
  build_scene: BuildSceneConfig;
  verse_quest: VerseQuestConfig;
  explore_adventure: ExploreAdventureConfig;
  hero_card: HeroCardConfig;
  team_mission: TeamMissionConfig;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse request body
    const input: PastorInput = await req.json();

    // Validate required fields
    const requiredFields = [
      'theme',
      'virtue',
      'bibleStoryTitle',
      'bibleStoryReference',
      'bibleStorySummary',
      'memoryVerseText',
      'memoryVerseReference',
      'bottomLine',
      'application',
    ];

    for (const field of requiredFields) {
      if (!input[field as keyof PastorInput]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const client = new Anthropic({ apiKey });

    // Create the prompt for Claude
    const systemPrompt = `You are a creative game designer for BibleCraft, a gamified Bible learning app for children ages 5-9. Your role is to generate engaging, age-appropriate content that teaches Biblical virtues through interactive games.

Generate JSON that exactly matches this TypeScript structure. Output ONLY valid JSON, no markdown, no explanations.

Key guidelines:
- Content must be age-appropriate for 5-9 year olds
- Create fun, engaging experiences tied directly to the Bible story and virtue
- Use emoji, emojis and playful language
- Make challenges progressively harder across rounds
- Include narrative elements that connect to the Bible story
- Generate creative choices that guide children toward the virtue
- The content should feel like an adventure, not a lesson`;

    const userPrompt = `Generate gamified Bible content for this week:

Theme: ${input.theme}
Virtue: ${input.virtue}
Bible Story: ${input.bibleStoryTitle} (${input.bibleStoryReference})
Story Summary: ${input.bibleStorySummary}
Memory Verse: "${input.memoryVerseText}" (${input.memoryVerseReference})
Bottom Line: ${input.bottomLine}
Application: ${input.application}

Return JSON with this exact structure:
{
  "build_scene": {
    "scene_id": "string (e.g., scene_courage)",
    "background": "emoji",
    "pieces": [
      {
        "emoji": "emoji",
        "name": "string",
        "position": "string (e.g., 'center', 'top-left', 'bottom-right')",
        "order": number
      }
    ],
    "completion_narration": "string",
    "verse_reveal": {
      "reference": "string",
      "text": "string"
    }
  },
  "verse_quest": {
    "verse": "string",
    "reference": "string",
    "rounds": [
      {
        "type": "full_display" | "blanks" | "mostly_hidden" | "full_recall",
        "mode": "tap_along" | "voice_or_type",
        "hidden_words": ["string"],
        "visible_words": ["string"],
        "choices_include_distractors": boolean
      }
    ]
  },
  "explore_adventure": {
    "story_id": "string",
    "scenes": [
      {
        "narration": "string",
        "choices": [
          {
            "text": "string",
            "virtue": "string" | null,
            "is_scripture": boolean,
            "advances": boolean,
            "teaches": "string"
          }
        ]
      }
    ],
    "conclusion": "string"
  },
  "hero_card": {
    "hero": "string",
    "title": "string",
    "virtue": "string",
    "power": "string",
    "verse": "string",
    "story_summary": "string",
    "rarity": "common" | "rare" | "epic" | "legendary",
    "art_prompt": "string (describe a Minecraft-style hero for image generation)"
  },
  "team_mission": {
    "mission_title": "string",
    "description": "string",
    "goals": {
      "builds_completed": number,
      "verses_memorized": number,
      "adventures_finished": number
    },
    "bronze_threshold": number,
    "silver_threshold": number,
    "gold_threshold": number,
    "bronze_reward": "string",
    "silver_reward": "string",
    "gold_reward": "string",
    "milestone_25": "string",
    "milestone_50": "string",
    "milestone_75": "string",
    "milestone_100": "string",
    "team_celebration": "string",
    "reward": "string",
    "deadline": "ISO8601 timestamp string (7 days from now)"
  }
}

Make sure:
1. Build scene has 6 pieces with emojis that relate to the Bible story
2. Verse quest has exactly 4 rounds with progression from easy to hard
3. Adventure scenes directly reference the Bible story and virtue
4. Hero card has a detailed Minecraft-style art prompt
5. Team mission goals are specific numbers (15, 5, 3 or similar)
6. All timestamps are valid ISO 8601
7. All text is concise, engaging, and age-appropriate`;

    // Call Claude API
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    // Extract the text content
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    // Parse the JSON response
    let generatedContent: GeneratedContent;
    try {
      generatedContent = JSON.parse(textContent.text);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', textContent.text);
      throw new Error('Invalid JSON from Claude');
    }

    // Validate the structure
    if (
      !generatedContent.build_scene ||
      !generatedContent.verse_quest ||
      !generatedContent.explore_adventure ||
      !generatedContent.hero_card ||
      !generatedContent.team_mission
    ) {
      throw new Error('Generated content missing required fields');
    }

    // Return the generated content
    return new Response(JSON.stringify(generatedContent), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in generate-content function:', error);

    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return new Response(
      JSON.stringify({
        error: 'Failed to generate content',
        details: message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};

export default handler;
