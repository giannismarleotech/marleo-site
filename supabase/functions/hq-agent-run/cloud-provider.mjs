import {createProvider} from './provider.mjs';
import {createGroqProvider} from './groq.mjs';
// Setting the server-side Groq key switches all draft/test execution to Groq.
// Never send a rejected Groq request back to the failing Gemini service.
export function createCloudProvider({groqKey,geminiKey,geminiModel,fetcher=fetch,...options}){
 return groqKey?.trim()?createGroqProvider({key:groqKey,fetcher,...options}):createProvider({key:geminiKey,model:geminiModel||undefined,fetcher,...options});
}
