import { _formatUserMsg, formatUserMsg, IDEATION_PROMPT, REGULATION_STRUCTURE, SNIPPET_STRUCTURE, SYSTEM_PROMPT } from "./prompt"
import OpenAI from "openai";
import { getDataURL } from "./svg-processor";
import { get } from "animejs";


const tokenCalc = (msg: string) => {
    return Math.floor(msg.length / 4)
}


const getHistory = (messages: Message[]) => {


}

const SYSTEM_MSG = {
    role: 'system',
    content: SYSTEM_PROMPT
}

const getHeaders = (token: string) => {
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
}

const GPT_MODEL =  'gpt-5.5' //'gpt-4o-mini'


const queryGPT = async (token: string, msgs: Chat2GPT[], structure: OpenAI.ResponseFormatJSONSchema|null = null, svgEle: SVGElement | null = null) => {
    const openai = new OpenAI({
        apiKey: token,
        dangerouslyAllowBrowser: true
    });

    const param = {
        model: GPT_MODEL,
    } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
    if (structure) {
        param.response_format = structure
    }

    if (svgEle !== null) {
        return getDataURL(svgEle).then((imageData) => {
            const non_img_msgs = msgs.slice(0, msgs.length - 1) as OpenAI.ChatCompletionMessageParam[]
            const img_msg = {
                role: "user",
                content: [{
                    type: "text",
                    text: msgs[msgs.length - 1].content
                },{
                    type: "image_url",
                    image_url: {
                        "url": imageData as unknown as string,
                        "detail": "low"
                    }
                }]
            } as OpenAI.ChatCompletionMessageParam
            param.messages = [...non_img_msgs, img_msg]
            return openai.chat.completions.create(param, {
                headers: getHeaders(token)
            }).then((response) => {
                console.log(response.choices[0].message.content);
                return response.choices[0].message.content;
              }).catch((err) => {
                console.error(err);
                return new Promise((resolve, reject) => {reject(err)})
              }
            );
        })
    }

    param.messages = msgs as OpenAI.ChatCompletionMessageParam[]
   
    return openai.chat.completions.create(param, {
        headers: getHeaders(token)
    }).then((response) => {
        console.log(response.choices[0].message.content);
        return response.choices[0].message.content;
      }).catch((err) => {
        console.error(err);
      }
    );

}

const contextFreeQueryGPT = async (token: string, msgs: Chat2GPT[], structure: OpenAI.ResponseFormatJSONSchema|null = null, needDebug=false, model=GPT_MODEL) => {
    const openai = new OpenAI({
        apiKey: token,
        dangerouslyAllowBrowser: true
    });
   
    const param = {
        model: model,
    } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
    if (structure) {
        param.response_format = structure
    }

    param.messages = msgs as OpenAI.ChatCompletionMessageParam[]
   
    return openai.chat.completions.create(param, {
        headers: getHeaders(token)
      }).then((response) => {
        console.log('context free\n', response.choices[0].message.content);
        return response.choices[0].message.content;
      }).catch((err) => {
        console.error(err);
      }
    );
}

const getMsg2GPT = (messages: Message[], options: MessageOption={}) => {
    const msgs = [SYSTEM_MSG] as Chat2GPT[]
    const versionIdList = options.selectedCode?.map(v => v.idx) || []
    messages.forEach((msg, idx) => {
        if (idx === messages.length - 1) {
           const content = options.isInspire? IDEATION_PROMPT: formatUserMsg(msg.content, options.svg||"")
           msgs.push({
                role: 'user',
                content
           })
        } else {
             if (msg.role === 'user') {
            msgs.push({
                role: 'user',
                content: msg.content
            })
        } else {
            // check if there is a versionIdx key in the message and if it is in the activeVersion list
            let exteraMessage = ""
            if (msg.versionIdx && versionIdList.includes(msg.versionIdx)) {
                exteraMessage += options.selectedCode?.find(v => v.idx === msg.versionIdx)?.code || ""
            }
            msgs.push({
                role: 'assistant',
                content: msg.content + exteraMessage
            })
        }

        }
    })
    return msgs
}

const _getMsg2GPT = (messages: Message[], options: MessageOption={}) => {
    const msgs = [SYSTEM_MSG] as Chat2GPT[]
    const versionIdList = options.selectedCode?.map(v => v.idx) || []
    messages.forEach((msg, idx) => {
        if (idx === messages.length - 1) {
           const content = options.isInspire? IDEATION_PROMPT: _formatUserMsg(msg.content, options.svg||"")
           msgs.push({
                role: 'user',
                content
           })
        } else {
            if (msg.role === 'user') {
                msgs.push({
                    role: 'user',
                    content: msg.content
                })
            } else {
                // check if there is a versionIdx key in the message and if it is in the activeVersion list
                let exteraMessage = ""
                if (msg.versionIdx && versionIdList.includes(msg.versionIdx)) {
                    exteraMessage += options.selectedCode?.find(v => v.idx === msg.versionIdx)?.code || ""
                }
                msgs.push({
                    role: 'assistant',
                    content: msg.content + exteraMessage
                })
            }
        }
    })
    return msgs
}

const testAPITokenValidity = (token: string) => {
    const openai = new OpenAI({
        apiKey: token,
        dangerouslyAllowBrowser: true
    })
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

    return openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: 'Hello'
            },
            {
                role: 'user',
                content: 'Hi'
            }
        ],
        model: GPT_MODEL,
      }, {
        headers: headers
      })
}

const approximatedToken = (text: string) => {
    const words = text.split(/\s+/).length;
    return Math.ceil(words / 0.75);
}

export {
    tokenCalc,
    getMsg2GPT,
    _getMsg2GPT,
    queryGPT,
    testAPITokenValidity,
    approximatedToken
}