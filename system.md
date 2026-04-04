                          ┌──────────────────────────────┐
                          │        Astronaut User        │
                          │   Voice Command / Text Input │
                          └──────────────┬───────────────┘
                                         │
                     ┌───────────────────┴───────────────────┐
                     │                                       │
                     ▼                                       ▼
        ┌────────────────────────┐              ┌────────────────────────┐
        │   Voice Input (Mic)    │              │   Text Input (UI)      │
        └─────────────┬──────────┘              └─────────────┬──────────┘
                      │                                       │
                      ▼                                       │
        ┌────────────────────────┐                            │
        │ Local ASR (Whisper)    │                            │
        │ Speech → Transcript    │                            │
        └─────────────┬──────────┘                            │
                      │                                       │
                      └───────────────────┬───────────────────┘
                                          ▼
                          ┌──────────────────────────────┐
                          │   Command Normalization      │
                          │  Canonical EVA Command Form  │
                          └──────────────┬───────────────┘
                                         │
                                         ▼
                          ┌──────────────────────────────┐
                          │ Intent Parser / Classifier   │
                          │  Constrained, Rule-Based     │
                          └──────────────┬───────────────┘
                                         │
                                         ▼
                          ┌──────────────────────────────┐
                          │   Guardrails / Safety Layer  │
                          │  Validate / Reject / Confirm │
                          └──────────────┬───────────────┘
                                         │
                                         ▼
                          ┌──────────────────────────────┐
                          │   Command Dispatch Pipeline  │
                          │   Shared by Text + Voice     │
                          └──────────────┬───────────────┘
                                         │
                 ┌───────────────────────┼────────────────────────┐
                 │                       │                        │
                 ▼                       ▼                        ▼
   ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
   │ Mission State Manager│  │ Procedure Engine     │  │ Warning / Alert Logic│
   │ Phase-aware control  │  │ Step-by-step actions │  │ Safety recommendations│
   └────────────┬─────────┘  └────────────┬─────────┘  └────────────┬─────────┘
                │                         │                         │
                └───────────────┬─────────┴───────────────┬─────────┘
                                │                         │
                                ▼                         ▼
                   ┌────────────────────────┐   ┌────────────────────────┐
                   │ Telemetry Service      │   │ Navigation Service     │
                   │ (currently mock,       │   │ (currently stub /      │
                   │ later live TSS feed)   │   │ later live provider)   │
                   └────────────┬───────────┘   └────────────┬───────────┘
                                │                            │
                                └──────────────┬─────────────┘
                                               ▼
                              ┌────────────────────────────────┐
                              │     Response Generator         │
                              │ Concise, mission-safe output   │
                              └──────────────┬─────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
                       ▼                                           ▼
          ┌────────────────────────────┐             ┌────────────────────────────┐
          │ Visual Output (Mission UI) │             │ Voice Output (Browser TTS) │
          │ status / procedure / alert │             │ spoken assistant response   │
          └────────────────────────────┘             └────────────────────────────┘


      External Systems to Integrate Next:
      ┌──────────────────────┐      ┌──────────────────────┐
      │ Real TSS Server      │ ---> │ Telemetry Adapter    │
      └──────────────────────┘      └──────────────────────┘

      ┌──────────────────────┐      ┌──────────────────────┐
      │ Navigation Provider  │ ---> │ Navigation Adapter   │
      └──────────────────────┘      └──────────────────────┘