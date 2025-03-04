# Realtime speech AI managing accounts and transfer


This is the source code of the AI showcase demonstrated at [Norway Fintech Festival 2025](https://www.norwayfintechfestival.no/2025)

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
