// AI Summarization Service
// Converts multiple detection results into single meaningful descriptions

export interface SummarizedResult {
  name: string;
  description: string;
  confidence: number;
  reasoning: string;
}

export interface RawDetectionResult {
  name: string;
  confidence: number;
  category: string;
  source: 'google' | 'amazon';
}

/**
 * Summarize multiple detection results into a single meaningful description
 */
export async function summarizeDetections(
  googleResults: any[],
  amazonResults: any[]
): Promise<SummarizedResult> {
  try {
    // Check if OpenAI API key is configured
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your-api-key-here') {
      console.log('OpenAI API key not configured, using fallback summarization');
      return fallbackSummarization(googleResults, amazonResults);
    }

    // Combine all detection results
    const allDetections = [
      ...googleResults.map(item => ({
        name: item.name,
        confidence: item.confidence,
        category: item.category,
        source: 'google' as const
      })),
      ...amazonResults.map(item => ({
        name: item.name,
        confidence: item.confidence,
        category: item.category,
        source: 'amazon' as const
      }))
    ];

    if (allDetections.length === 0) {
      return {
        name: 'Unknown Item',
        description: 'No items detected in the image',
        confidence: 0,
        reasoning: 'No detection results available'
      };
    }

    // Create prompt for OpenAI
    const prompt = createSummarizationPrompt(allDetections);
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing object detection results and creating concise, meaningful product descriptions. You excel at identifying the primary object in an image and combining multiple detection attributes into a single, clear description.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Parse the AI response
    return parseAIResponse(aiResponse, allDetections);

  } catch (error) {
    console.error('AI summarization failed:', error);
    return fallbackSummarization(googleResults, amazonResults);
  }
}

/**
 * Create a prompt for OpenAI to summarize detection results
 */
function createSummarizationPrompt(detections: RawDetectionResult[]): string {
  const detectionList = detections
    .sort((a, b) => b.confidence - a.confidence)
    .map(d => `${d.name} (${Math.round(d.confidence * 100)}% confidence, ${d.category}, ${d.source})`)
    .join(', ');

  return `Analyze these object detection results and create a single, meaningful product description:

DETECTION RESULTS: ${detectionList}

INSTRUCTIONS:
1. Identify the PRIMARY object in the image (the main item the user is photographing)
2. ONLY use attributes that belong to the primary object itself (not background, table, or surface materials)
3. Ignore background elements like tables, floors, walls, or surfaces
4. Focus on the item's own color, material, style, and brand
5. Create a practical description that would be useful for pricing/selling
6. Provide a realistic confidence score based on the detection quality

RESPONSE FORMAT (JSON):
{
  "name": "Clear Product Name",
  "description": "Brief description of the item",
  "confidence": 0.85,
  "reasoning": "Why this is the best interpretation"
}

EXAMPLES:
- Input: "chair (97%), wood (99%), furniture (97%), seat (99%), outdoor (94%), garden (93%)"
- Output: {"name": "Wooden Garden Bench", "description": "A wooden outdoor bench suitable for garden settings", "confidence": 0.89, "reasoning": "High confidence in wood material and outdoor furniture context"}

- Input: "coffee cup (95%), disposable (92%), cup (98%), hardwood (85%), table (88%)"
- Output: {"name": "Disposable Coffee Cup", "description": "A disposable coffee cup for hot beverages", "confidence": 0.92, "reasoning": "Focus on the cup itself, ignoring table material (hardwood) which is background"}

- Input: "shirt (95%), blue (98%), cotton (92%), clothing (94%), casual (88%)"
- Output: {"name": "Blue Cotton Shirt", "description": "A casual blue cotton shirt", "confidence": 0.92, "reasoning": "Clear identification of material, color, and item type"}`;
}

/**
 * Parse the AI response into our standardized format
 */
function parseAIResponse(aiResponse: string, detections: RawDetectionResult[]): SummarizedResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        name: parsed.name || 'Unknown Item',
        description: parsed.description || 'Item detected',
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'AI analysis completed'
      };
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error);
  }

  // Fallback parsing if JSON parsing fails
  return {
    name: 'AI Analyzed Item',
    description: aiResponse.substring(0, 100),
    confidence: 0.7,
    reasoning: 'AI provided analysis but format was unclear'
  };
}

/**
 * Fallback summarization when OpenAI is not available
 */
function fallbackSummarization(googleResults: any[], amazonResults: any[]): SummarizedResult {
  const allResults = [...googleResults, ...amazonResults];
  
  if (allResults.length === 0) {
    return {
      name: 'Unknown Item',
      description: 'No items detected',
      confidence: 0,
      reasoning: 'No detection results available'
    };
  }

  // Sort by confidence and take the best result
  const bestResult = allResults.sort((a, b) => b.confidence - a.confidence)[0];
  
  // Try to create a meaningful name by combining attributes
  const attributes = allResults
    .filter(r => r.confidence > 0.7)
    .map(r => r.name.toLowerCase())
    .slice(0, 3); // Take top 3 attributes

  // Simple heuristic to create a better name
  let name = bestResult.name;
  if (attributes.length > 1) {
    // Look for color/material combinations, but exclude background materials
    const colors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'brown', 'pink', 'purple'];
    const materials = ['cotton', 'wool', 'leather', 'wood', 'metal', 'plastic', 'denim'];
    const backgroundMaterials = ['hardwood', 'table', 'floor', 'wall', 'surface', 'background'];
    
    // Filter out background materials
    const filteredAttributes = attributes.filter(attr => 
      !backgroundMaterials.some(bg => attr.includes(bg))
    );
    
    const foundColor = filteredAttributes.find(attr => colors.some(color => attr.includes(color)));
    const foundMaterial = filteredAttributes.find(attr => materials.some(material => attr.includes(material)));
    
    if (foundColor && foundMaterial) {
      name = `${foundColor.charAt(0).toUpperCase() + foundColor.slice(1)} ${foundMaterial.charAt(0).toUpperCase() + foundMaterial.slice(1)} ${bestResult.name}`;
    } else if (foundColor) {
      name = `${foundColor.charAt(0).toUpperCase() + foundColor.slice(1)} ${bestResult.name}`;
    }
  }

  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    description: `${name} detected with ${Math.round(bestResult.confidence * 100)}% confidence`,
    confidence: bestResult.confidence,
    reasoning: 'Fallback analysis using best detection result'
  };
}
