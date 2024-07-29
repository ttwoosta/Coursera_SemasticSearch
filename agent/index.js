import OpenAI from "openai"
import { openai } from "../config";
import { getCurrentWeather, getLocation } from './tools';

/**
 * Goal - build an agent that can get the current weather at my current location
 * and give me some localized ideas of activities I can do.
 */

document.getElementById('re-act-btn').onclick = async (e) => {
  // call a function to get current location and pass it to the prompt
  let location = await getLocation();
  let weather = await getCurrentWeather();

  let prompt = `Give me a list of activity ideas based on my current location ${location} and weather ${weather}`;
  console.debug(prompt);

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

  console.log(response.choices[0].message.content)
};


/**
 * Goal - build an agent that can answer any questions that might require knowledge about my current location and the current weather at my location.
 */

/**
 PLAN:
 1. Design a well-written ReAct prompt
 2. Build a loop for my agent to run in.
 3. Parse any actions that the LLM determines are necessary
 4. End condition - final Answer is given
 
 */


const systemPrompt = `
 You cycle through Thought, Action, PAUSE, Observation. At the end of the loop you output a final Answer. Your final answer should be highly specific to the observations you have from running
 the actions.
 1. Thought: Describe your thoughts about the question you have been asked.
 2. Action: run one of the actions available to you - then return PAUSE.
 3. PAUSE
 4. Observation: will be the result of running those actions.
 
 Available actions:
 - getCurrentWeather: 
     E.g. getCurrentWeather: Salt Lake City
     Returns the current weather of the location specified.
 - getLocation:
     E.g. getLocation: null
     Returns user's location details. No arguments needed.
 
 Example session:
 Question: Please give me some ideas for activities to do this afternoon.
 Thought: I should look up the user's location so I can give location-specific activity ideas.
 Action: getLocation: null
 PAUSE
 
 You will be called again with something like this:
 Observation: "New York City, NY"
 
 Then you loop again:
 Thought: To get even more specific activity ideas, I should get the current weather at the user's location.
 Action: getCurrentWeather: New York City
 PAUSE
 
 You'll then be called again with something like this:
 Observation: { location: "New York City, NY", forecast: ["sunny"] }
 
 You then output:
 Answer: <Suggested activities based on sunny weather that are highly specific to New York City and surrounding areas.>
 `
/**
* Challenge: Set up the function
* 1. Create a function called `agent` that takes a `query` as a parameter
* 2. Create a messages array that follows the pattern openai expects for 
*    its chat completions endpoint. The first message should be the system
*    prompt we wrote above, and the second message should be the query 
*    from the user found in the `agent` function parameter.
* 3. Move the code below inside the function (and uncomment it)
* 4. Call the function with a string query of any kind and see what gets returned.
*/

const promptEle = document.getElementById('agent-prompt');
promptEle.value = "What's the current weather in Tokyo and New York city?";


document.getElementById('agent-btn').onclick = async (e) => {
  let button = document.getElementById('agent-btn');
  button.disabled = true;
  await agent(promptEle.value);
  button.disabled = false;
};

const _availableFunctions = {
  getCurrentWeather,
  getLocation
}

const _findActionRegex = /^Action: (\w+): (.*)$/;
const _findAnswerRegex = /^Answer: /;

async function agent(query) {
  let messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query }
  ];


  const MAX_ITERATIONS = 5;

  for (let index = 0; index < MAX_ITERATIONS; index++) {
    console.debug(`Iteration #${index + 1}`);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages
    });

    /**
     * CHALLENGE:
     * 1. Split the string on the newline character ("\n")
     * 2. Search through the array of strings for one that has "Action:"
     *      regex to use: 
     *      const actionRegex = /^Action: (\w+): (.*)$/
     * 3. Parse the action (function and parameter) from the string
     */
    console.log(response.choices[0].message.content);
    const lastResp = response.choices[0].message.content;

    // insert the response message to messages array
    messages.push({
      role: 'assistant',
      content: lastResp
    });

    const lines = lastResp.split('\n');
    const actionLine = lines.find(l => _findActionRegex.test(l));
    if (actionLine) {
      let obs = await performAction(actionLine);
      messages.push(obs);
    }

    const answerLine = lines.find(l => _findAnswerRegex.test(l));
    if (answerLine) {
      console.log("Agent has finished with an answer");
      return lastResp;
    }
  }
}

async function performAction(line) {
  const [_, action, actionArg] = _findActionRegex.exec(line);
  console.debug(action);

  if (_availableFunctions.hasOwnProperty(action)) {
    const observation = await _availableFunctions[action](actionArg);
    console.debug('RESULT: ' + observation);
    return {
      role: 'assistant',
      content: `Observation: ${observation}`
    };
  }
  else {
    throw new Error(`Unknown action: ${action}: ${actionArg}`);
  }

}


const funcCallBtn = document.getElementById('func-calling-btn');
funcCallBtn.onclick = async (e) => {
  funcCallBtn.disabled = true;
  await functionCalling(promptEle.value);
  funcCallBtn.disabled = false;
};

async function functionCalling(query) {
  const messages = [
    { role: "system", content: "You are a helpful AI agent. Give highly specific answers based on the information you're provided. Prefer to gather information with the tools provided to you rather than giving basic, generic answers." },
    { role: "user", content: query }
  ]

  const MAX_ITERATIONS = 5

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(`Iteration #${i + 1}`)
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      tools: [
        {
          type: "function",
          function: {
            name: "getCurrentWeather",
            description: "Get the current weather",
            parameters: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "The location from where to get the weather"
                },
                unit: {
                  type: "string",
                  enum: ["celcius", "fahrenheit"]
                }
              }
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getLocation",
            description: "Get the user's current location",
            parameters: {
              type: "object",
              properties: {}
            }
          }
        },
      ]
    })

    //const responseText = response.choices[0].message.content
    const choice = response.choices[0];
    console.log(choice);

    const { finish_reason: finishReason, message } = response.choices[0]
    const { tool_calls: toolCalls } = message

    messages.push(message);

    if (choice.finish_reason === 'stop') {
      // return the result
      console.log(choice.message.content);
      console.log("AGENT ENDING");
      return;
    }
    else if (choice.finish_reason === 'tool_calls') {
      // call the functions
      for (const tool of choice.message.tool_calls) {
        let funcName = tool.function.name;
        let arg = JSON.parse(tool.function.arguments);
        let observation = await _availableFunctions[funcName](arg);
        console.debug(observation);

        // append results
        messages.push({
          tool_call_id: tool.id,
          role: 'tool',
          tool: funcName,
          content: observation
        });

        // continue
      }
    }
  }
}