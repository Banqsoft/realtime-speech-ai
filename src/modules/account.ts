import { Buffer } from "buffer";
import { Near, ConnectConfig, keyStores, KeyPair } from "near-api-js";
import { refreshMainComponent } from "../ui";

window.Buffer = Buffer;
const keyStore = new keyStores.BrowserLocalStorageKeyStore();
const networkId = "testnet";
const contractId = "qcredits.testnet";

const nearConfig: ConnectConfig = {
  networkId,
  nodeUrl: "https://archival-rpc.testnet.fastnear.com/",
  walletUrl: "https://wallet.testnet.near.org",
  keyStore,
};

const near = new Near(nearConfig);

export interface Account {
  name: string;
  availableBalance: number;
  ftBalance: string;
  type: "asset" | "liability";
}

export interface Transaction {
  date: Date;
  amount: number;
  memo: string;
}

export async function getAccountNames(): Promise<string[]> {
  const accountNames = await keyStore.getAccounts(networkId);
  return accountNames;
}

const nearAccount = await near.account(contractId);

const ft_metadata = await nearAccount.viewFunction({
  contractId,
  methodName: "ft_metadata",
  args: {},
});

export async function getFtMetadata() {
  return ft_metadata;
}

export function adjustAmount(amount: BigInt) {
  return Number(amount) / Math.pow(10, ft_metadata.decimals);
}

export async function getFungibleTokenBalance(account_id: string): Promise<bigint> {
  const nearAccount = await near.account(account_id);
  const ft_balance = BigInt(
    await nearAccount.viewFunction({
      contractId,
      methodName: "ft_balance_of",
      args: { account_id },
    }),
  );
  return ft_balance;
}

export async function getAccountBalance(account_id: string): Promise<number> {
  const ft_balance = BigInt(await getFungibleTokenBalance(account_id));
  return adjustAmount(ft_balance);
}

export async function getAccounts(): Promise<Account[]> {
  const accountNames = await getAccountNames();

  const accountData: Account[] = [];
  for (let account_id of accountNames) {
    const ftBalance = await getFungibleTokenBalance(account_id);
    const availableBalance = adjustAmount(ftBalance);
    accountData.push({
      name: account_id,
      availableBalance,
      ftBalance: ftBalance.toString(),
      type: "asset",
    });
  }
  return accountData;
}

export async function getTransactionHistory(
  accountName: string,
): Promise<Transaction[]> {
  const nearblockResponse = await await fetch(
    "https://api-testnet.nearblocks.io/v1/account/" +
      accountName +
      "/ft-txns?per_page=6",
  );

  if (nearblockResponse.status === 429) {
    throw new Error(
      `Rate limit exceeded. Please try again later. Status: ${nearblockResponse.statusText}`,
    );
  }
  if (nearblockResponse.status !== 200) {
    throw new Error(
      `Failed to fetch transaction history: ${nearblockResponse.statusText}`,
    );
  }

  const ftTxns = await nearblockResponse.json();
  for (let txn of ftTxns.txns) {
    const txnStatus = await fetch(nearConfig.nodeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "dontcare",
        method: "tx",
        params: {
          tx_hash: txn.transaction_hash,
          sender_account_id: contractId,
          wait_until: "FINAL",
        },
      }),
    }).then((res) => res.json());
    const memo = JSON.parse(
      atob(txnStatus.result.transaction.actions[0].FunctionCall.args),
    ).memo;
    txn.memo = memo;
  }
  return ftTxns.txns.map((txn: any) => ({
    date: new Date(Number(BigInt(txn.block_timestamp) / 1_000_000n)),
    amount: adjustAmount(txn.delta_amount),
    memo: txn.memo ?? "",
  }));
}

export async function importAccount(
  accountName: string,
  privateKey: string,
): Promise<void> {
  const keyPair = KeyPair.fromString(privateKey);
  await keyStore.setKey(networkId, accountName, keyPair);
}

export async function transfer(
  fromAccount: string,
  toAccount: string,
  amount: number,
) {
  const convertedAmount = BigInt(amount * Math.pow(10, ft_metadata.decimals));

  const account = await near.account(fromAccount);
  const result = await account.functionCall({
    contractId,
    methodName: "ft_transfer",
    args: {
      receiver_id: toAccount,
      amount: convertedAmount.toString(),
      memo: `Transfer from ${fromAccount}`,
    },
    gas: 30_000_000_000_000n,
    attachedDeposit: 1n,
  });
  refreshMainComponent();
  return JSON.stringify(result.status);
}

export async function fundAccount(receiver_id: string) {
  const account = await near.account(receiver_id);
  const result = await account.functionCall({
    contractId,
    methodName: "call_js_func",
    args: {
      function_name: "fund_my_account",
    },
    gas: 30_000_000_000_000n,
  });
  refreshMainComponent();
  return JSON.stringify(result.status);
}
