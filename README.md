# Realtime speech AI managing accounts and transfer


This is the source code of the AI showcase demonstrated at [Norway Fintech Festival 2025](https://www.norwayfintechfestival.no/2025). While the recording from the presentation from the festival is not publicly available, you can see the rehersal recording via this [Linkedin post here](https://www.linkedin.com/posts/banqsoft_peter-s-demos-ai-in-a-core-banking-system-activity-7317873520590360577-lgTJ?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAAF6UkBRylK0Bu-BGkfq7kbhB3YsBS66yw).

The code in this respository is based on https://github.com/Azure-Samples/cognitive-services-speech-sdk/tree/master/samples/realtime-api-plus/web

# Setting up environment

Copy the file [.env.example](./.env.example) to a file named `.env` and adjust it with your own settings for Azure AI endpoint, api-key and deployment name.

# Install dependencies and run

```bash
npm install
npm run dev
```

# Deploying the smart contract and minting the fungible token

See [contract/README.md](./contract/README.md).
