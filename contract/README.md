Smart contract
==============

# Deploy the fungible token contract to testnet

The following command will deploy the contract and mint the fungible token

```bash
near contract deploy qcredits.testnet use-file fungible_token.wasm with-init-call new json-args '{"owner_id": "qcredits.testnet", "total_supply": "999999999999", "metadata": { "spec": "ft-1.0.0","name": "Banq","symbol": "BANQ","decimals": 6, "icon": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiPgogIDxkZWZzPgogICAgPHBhdGggaWQ9InBhdGgtMSIgZD0iTTkuODk1LjAwMSAyOS43NDUgMGMzLjU2NiAwIDQuODU5LjM3MSA2LjE2MiAxLjA2OWE3LjI3IDcuMjcgMCAwIDEgMy4wMjQgMy4wMjRsLjE0LjI3Yy42MDcgMS4yMjIuOTI5IDIuNTcyLjkyOSA1Ljg5M3YxOS40ODhjMCAzLjU2Ny0uMzcxIDQuODYtMS4wNjkgNi4xNjNhNy4yNyA3LjI3IDAgMCAxLTMuMDI0IDMuMDI0bC0uMjcuMTRjLTEuMjIyLjYwNy0yLjU3Mi45MjktNS44OTMuOTI5SDEwLjI1NmMtMy41NjcgMC00Ljg2LS4zNzEtNi4xNjMtMS4wNjlhNy4yNyA3LjI3IDAgMCAxLTMuMDI0LTMuMDI0bC0uMTQtLjI3Qy4zNDQgMzQuNDYuMDI0IDMzLjE2NCAwIDMwLjEwNUwwIDEwLjI1NUMwIDYuNjkuMzcxIDUuMzk3IDEuMDY5IDQuMDk0YTcuMjcgNy4yNyAwIDAgMSAzLjAyNC0zLjAyNGwuMjctLjE0QzUuNTQuMzQ0IDYuODM2LjAyNCA5Ljg5NSAwWiIvPgogIDwvZGVmcz4KICA8ZyBpZD0ibG9nby0vLXNob3J0IiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIj4KICAgIDxnIGlkPSJHcm91cCI+CiAgICAgIDxtYXNrIGlkPSJtYXNrLTIiIGZpbGw9IiNmZmYiPgogICAgICAgIDx1c2UgeGxpbms6aHJlZj0iI3BhdGgtMSIvPgogICAgICA8L21hc2s+CiAgICAgIDx1c2UgeGxpbms6aHJlZj0iI3BhdGgtMSIgaWQ9InJlY3RhbmdsZSIgZmlsbD0iIzI5NjVDQyIvPgogICAgICA8cGF0aCBpZD0iUGF0aCIgZmlsbD0iI0ZGRiIgZmlsbC1ydWxlPSJub256ZXJvIiBkPSJNMjMuNzcgMjguNTQyYzEuMzk1LTIuNTcgMi4wOTMtNS4wNyAyLjY1Mi03LjcwOS45MDctNC4zMDUgMS42NzUtMTIuMDE0LTMuOTEtMTIuMDgzLTUuMzc0IDAtOC4zMDYgNi43MzYtOS4yMTQgMTEuMDQyLTEuMzI2IDYuMjUgMi4zNzQgMTAuOTcyIDguNTE3IDEwLjk3MiAyLjA5NCAwIDUuMzc1LS4yNzggNy41MzktLjk3MmwtLjgzOCAxLjg3NWMtMi43MjMuOTAyLTYuNzAxIDEuMjUtOS4zNTQgMS4yNS03LjgxOCAwLTEyLjE0Ni00LjU4NC0xMC40Ny0xMi43NzggMS40NjUtNi44NzUgNi45MS0xMi45ODYgMTQuMTctMTMuMDU2IDcuMTkgMCA5Ljg0MiA1LjIwOSA4LjQ0NiAxMi4xNTMtLjgzOCAzLjk1OC0zLjIxMSA4LjEyNS02LjU2MiAxMC42OTVsLS45NzctMS4zOVoiIG1hc2s9InVybCgjbWFzay0yKSIvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg=="}}' prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' network-config testnet sign-with-legacy-keychain send
```

# Deploy JavaScript functions to the contract

```bash
near contract call-function as-transaction qcredits.testnet post_javascript json-args '{"javascript": "export function fund_my_account() { env.ft_transfer_internal(env.current_account_id(), env.predecessor_account_id(), 3_000_000n.toString()); }"}' prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' sign-as qcredits.testnet network-config testnet sign-with-keychain send
```


# Create account

Replace the public key with your own

```bash
near account create-account fund-myself savings-42.testnet '0.1 NEAR' use-manually-provided-public-key ed25519:BPnDfrwYsvJFg8ZCQbfpq77CodZvTKKFzujwCdaUgVX6 sign-as qcredits.testnet network-config testnet
```

Register with the Fungible Token contract

```bash

```