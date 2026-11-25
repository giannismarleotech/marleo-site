# Marleo natural voice — prepared, not activated

## Voice direction
An original warm male voice, low-mid register, clear Dutch, subtly Flemish where naturally available. Calm, confident and helpful; not theatrical, whispered or imitating an actor. Natural pauses, normal pitch, concise replies. Match English fluently when that language is selected.

Voice design brief: “A warm, composed male digital assistant with a low-mid register and clear Dutch pronunciation. Natural conversational rhythm, restrained confidence, subtle warmth and short thoughtful pauses. Professional, helpful, never booming or theatrical. An original voice, not an imitation of any known person.”

Audition text: “Dag Giannis. Ik heb je overzicht klaar. Laten we eerst de aanvragen bekijken die nog een antwoord nodig hebben. Daarna kunnen we samen je volgende stap kiezen.” This is an audition, not a claim that research ran.

## Proposed provider
ElevenLabs Text to Speech; start evaluation with eleven_flash_v2_5 for responsive short replies. Select a licensed Dutch voice after listening; no voice ID has been selected or invented. Compare quality with eleven_multilingual_v2 before choosing. Model latency is not total response latency.
Sources checked 25 November 2026:
- https://elevenlabs.io/docs/overview/capabilities/text-to-speech
- https://elevenlabs.io/docs/api-reference/text-to-speech/convert

## Activation boundary
No provider request, account purchase, secret or paid usage was created for this preparation. Browser speech remains the current implementation. Pricing/plan, a licensed voice and a monthly cap must be agreed before activating. A better voice does not add general reasoning to the current grounded intent-based assistant.

## Planned integration contract (not yet implemented)
Authenticated server-side Supabase function, owner-only. Verify JWT and owner identity; never accept an owner ID supplied by the caller. Keep ELEVENLABS_API_KEY and approved voice ID in server secrets. API key must not appear in HTML, localStorage, logs or chat.

POST assistant-voice accepts a short assistant reply (maximum 1,200 characters) and supported locale. Server fixes the provider, voice and model; client cannot select arbitrary URLs. Return audio/mpeg or a clear unavailable/budget error. Limit concurrent generation, apply per-user rate limits and an atomic monthly character counter before sending. Do not silently retry paid requests after an uncertain response. Provider usage must be reconciled with the counter.

Only the reply intended to be read aloud goes to ElevenLabs, not the whole CRM or documents. Explain that transmission at activation and allow muting. Avoid reading banking, credentials or customer detail by default. No audio retention in HQ. Use request cancellation and generation IDs so interrupted or older replies cannot play later.

## Playback behaviour
First deliberate Start Marleo click enables the greeting. Subsequent responses may speak automatically while open. Closing, muting, logging out, hiding the tab or pressing the microphone stops playback. Keep the microphone off until pressed. No overlapping voice or background recitation. If AI audio fails, show the text and an explicit browser-voice option; do not disguise fallback as natural AI speech.

## Acceptance before activation
Test Dutch/English names and numbers, first-click autoplay on desktop and mobile, mute persistence, interruption, logout cancellation, blocked autoplay, provider timeouts, rate/budget exhaustion, owner authorization, and confirmation that keys never reach browser code. Use synthetic text first. Actual voice quality needs listening approval, not merely an HTTP success.
