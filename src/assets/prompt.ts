import {z} from 'zod';
import { zodResponseFormat } from "openai/helpers/zod";
import { OpenAI } from "openai";

const SYSTEM_PROMPT = `You are GPT4, the most advanced vision language model. You are an expert in write animation programs using \`anime.js\`. In this conversation, please help the user to generate animation scripts to animate the SVG image showing a metaphoric visualization. `

const QA_SYSTEM_PROMPT = `You are GPT4, the most advanced vision language model. You are an expert in data visualization. In this conversation, please help review an animation script and verify that it does not introduce misinformation or conflict with the original data visualization encoding.`

const SNIPPET_STRUCTURE = `Here is an example.
For a SVG-based visualization showing a barchart that mimic the oil spill, the user pose a question: "How to animate the oil spill effect?" The SVG content is as follows.
<svg id="oil-spill" width="400" height="300"><g class="drip"><line x1="66.66666666666667" y1="0" x2="66.66666666666667" y2="120"></line><circle cx="66.66666666666667" cy="124" r="6"></circle></g><g class="drip"><line x1="200" y1="0" x2="200" y2="180"></line><circle cx="200" cy="184" r="6"></circle></g><g class="drip"><line x1="333.33333333333337" y1="0" x2="333.33333333333337" y2="240"></line><circle cx="333.33333333333337" cy="244" r="6"></circle></g></svg>
And you may generate the animation specification as follows.
{
  "animation": [{
    "title": "Trace",
    "keyframe": {
        "targets": "line",
        "scaleY": [0.4, 0.6, 0.8]
        "duration": 2000,
        "easing": "easeInOutQuad",
        "delay": 0
    }
   "elaboration": "The oil spill trace from the top to the bottom."
}, {
    "title": "Drip",
    "keyframe": {
        "targets": "circle",
        "translateY": [0, 40, 80],
        "duration": 2000,
        "easing": "easeInOutQuad",
        "delay": 0
    },
    "elaboration": "The oil spill drips from the top to the bottom."
}],
   "message": "I use the bar's length to represent the oil spill, and the animation is to show the oil spill trace from the top to the bottom."
}
REMEMBER, DO NOT INCLUDE OTHER INFORMATION IN THE RESPONSE. ONLY RETURN THE JSON-FORMATTED OBEJCT WITHOUT \`\`\`.!!!! The anime.js keyframes should also be JSON!!!!
`

const _SNIPPET_STRUCTURE = `Here is an example.
For a SVG-based visualization showing a barchart that mimic the oil spill, the user pose a question: "How to animate the oil spill effect?" The SVG content is as follows.

And you may generate the animation specification as follows.
{
  script: "anime({
        targets: 'line',
        scaleY: [0.4, 0.6, 0.8]
        duration: 2000,
        easing: 'easeInOutQuad',
        delay: 0
})\nanime({
    targets: 'circle',
    translateY: [0, 40, 80],
    duration: 2000,
    easing: 'easeInOutQuad',
    delay: 0
})"`

const QA_STRUCTURE = `Here is an example.
For a SVG-based data visualization showing a barchart, the user pose a question: "How to animate the oil spill effect?" The SVG content is as follows.
<svg id="oil-spill" width="400" height="300"><g class="drip"><line x1="66.66666666666667" y1="0" x2="66.66666666666667" y2="120"></line><circle cx="66.66666666666667" cy="124" r="6"></circle></g><g class="drip"><line x1="200" y1="0" x2="200" y2="180"></line><circle cx="200" cy="184" r="6"></circle></g><g class="drip"><line x1="333.33333333333337" y1="0" x2="333.33333333333337" y2="240"></line><circle cx="333.33333333333337" cy="244" r="6"></circle></g></svg>
A given animation script is as follows.
{
    "targets": 'line',
    "scaleX": [0.4, 0.6, 0.8]
    "duration": 2000,
    "easing": 'easeInOutQuad',
    "delay": 0
}
An ideal response should be as follows.
{
    "visEncoding": "The visualization uses x position to show year and y position to show the value of the data.",
    "analysis": "The animation script uses the 'scaleX' property to animate the line. This property is used for encoding data in the original visualization. Animating this property may introduce confusion or misinterpretation of the data.",
    "isValid": false,
    "explanation": "The visual channel 'scaleX' is used for encoding data in the original visualization. Animating this property may introduce confusion or misinterpretation of the data."
}
`


const REGULATION_STRUCTURE = `
Please format your reponse in JSON strictly following the following structure.
{
    "animation": [A list of animation snippets according to the user query.]
    "message": A brief message to the user.
}
For the animation snippet, it should contain the following fields.
{
    "title": The title of the animation effect with no more than two words.
    "keyframe": [A list of keyframes to describe the animation effect. You should use JSON-formatted specifications in compliance with the anime.js library].
    "elaboration": A brief description of the unit animation effect.
}
`

const _REGULATION_STRUCTURE = `Please format your reponse in JSON strictly following the following structure.
{
    "script": The anime.js script generated for the user.
    "message": A direct message responding to the user.
}`

const QA_REGULATION_STRUCTURE = `Please format your response in JSON strictly following the following structure.
{
    "visEncoding": "The original data visualization encoding."
    "analysis": "Your thinking process on whether the animation script introduces misinformation or conflicts with the original data visualization encoding.",
    "isValid": true | false,
    "expalantion": "A short explanation on which animated properties conflict with the original data visualization encoding. Ideally, the visual channels should not be animated if they are already used for encoding data."
}
`

const IDEATION_PROMPT = ``


const formatUserMsg = (query: string, svg: string) => {
    const userMsg = `The user pose a question: ${query}.\n`
    const svgMsg = `The SVG content is as follows.\n${svg}`
    const instruction = `Please generate the animation script to animate the SVG image showing a metaphoric visualization.`
    const prompt = `${userMsg}\n${svgMsg}\n${instruction}\n${REGULATION_STRUCTURE}\n\n${SNIPPET_STRUCTURE}`
    return prompt
}

const _formatUserMsg = (query: string, svg: string) => {
    const userMsg = `The user pose a question: ${query}.\n`
    const svgMsg = `The SVG content is as follows.\n${svg}`
    const instruction = `Please generate the animation script to animate the SVG image showing a metaphoric visualization. If you think the user do not hope to get animation code, please put an empty string in the 'code' field.`
    const prompt = `${userMsg}\n${svgMsg}\n${instruction}\n${_REGULATION_STRUCTURE}\n\n${_SNIPPET_STRUCTURE}`
    return prompt
}

const formatQualityCheck = (query: string, animation: string, svg: string) => {
    const snippetMsg = `Here is the user query: ${query}, the generated animation is ${animation}.\n`
    const svgMsg = `The SVG content is as follows.\n${svg}`
    const instruction = `Please review the animation script and verify that the properties being animated do not conflict with the original data visualization encoding. Ignore the grammar.`
    const prompt = `${snippetMsg}\n${svgMsg}\n${instruction}\n${QA_REGULATION_STRUCTURE}\n\n${QA_STRUCTURE}`
    return prompt
}

const BASELINE_SCHEMA = zodResponseFormat(z.object({
    script: z.string().describe('The anime.js script generated for the user. Empty string "" if no need to generate the script'),
    message: z.string().describe('A direct message responding to the user')
}), 'BaselineSchema')

const ANIMATION_SCHEMA = {
    "type": "json_schema",
    "json_schema":{
        "name": "AnimationSchema",
        "strict": false,
        "schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "animation": {
            "type": "array",
            "description": "List of animation snippets",
            "items": {
                "type": "object",
                "properties": {
                "title": {
                    "type": "string",
                    "description": "One word title for the animated effect"
                },
                  "keyframe": {
                    "type": "object",
                    "description": "Anime.js keyframe for the animation effect",
                    "additionalProperties": true
            
                  },
                "description": {
                    "type": "string",
                    "description": "Description of the animation effect"
                }
                },
                "required": ["title", "description"],
                "additionalProperties": true
            }
            },
            "explanation": {
            "type": "string",
            "description": "Explanation of the animation effect"
            }
        },
        "required": ["animation", "explanation"],
        "additionalProperties": true
        }
  }
}as unknown as OpenAI.ResponseFormatJSONSchema

const QA_SCHEMA = zodResponseFormat(z.object({
    visEncoding: z.string().describe('The original data visualization encoding, e.g., x position for data attribute "A".'),
    analysis: z.string().describe('Your thinking process on whether the animation script introduces misinformation or conflicts with the original data visualization encoding.'),
    isValid: z.boolean().describe('A boolean value of whether the animation script is valid.'),
    explanation: z.string().describe('A short explanation on which animated properties conflict with the original data visualization encoding. Ideally, the visual channels should not be animated if they are already used for encoding data.')
}), 'QASchema')

export {
    SYSTEM_PROMPT,
    QA_SYSTEM_PROMPT,
    SNIPPET_STRUCTURE,
    REGULATION_STRUCTURE,
    IDEATION_PROMPT,
    formatUserMsg,
    _formatUserMsg,
    formatQualityCheck,
    ANIMATION_SCHEMA,
    BASELINE_SCHEMA,
    QA_SCHEMA
}