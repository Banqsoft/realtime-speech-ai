import { ToolsDefinition } from "rt-client";
import "./tool-components/account-overview-component.ts";
import "./tool-components/account-history-component.ts";
import "./tool-components/presentation-component.ts";
import { getMainComponentInfo, setMainWebComponent } from "./ui";
import {
  fundAccount,
  getAccountNames,
  getAccounts,
  getFtMetadata,
  getTransactionHistory,
  importAccount,
  transfer,
} from "./modules/account";

type ToolFunction = (args: Record<string, any>) => Promise<string>;

export const toolImplementations: Record<string, ToolFunction> = {
  show_account_overview: async () => {
    setMainWebComponent(document.createElement("account-overview"));
    return `Account overview component is added to the UI`;
  },
  show_account_history_overview: async ({ accountName }) => {
    if (!accountName || accountName === "") {
      return "Please provide an account name";
    }
    const accountNames = await getAccountNames();
    const hasAccount = accountNames.includes(accountName);
    if (!hasAccount) {
      return `You don't have access to ${accountName}. You can access one of the following accounts: ${accountNames.join(",")}`;
    }

    const accountHistoryComponent = document.createElement("account-history");
    accountHistoryComponent.setAttribute("data-account-name", accountName);
    setMainWebComponent(accountHistoryComponent);
    return `Account history component is added to the UI for ${accountName}`;
  },
  transfer: async ({ fromName, toName, amount }) => {
    const accountNames = await getAccountNames();
    const hasAccessToFromAccount = accountNames.includes(fromName);
    if (!hasAccessToFromAccount) {
      return `You don't have access to ${fromName}. Please transfer from one of the accounts you have access to. You can transfer from one of the following accounts: ${accountNames.join(",")}`;
    }
    try {
      const result = await transfer(fromName, toName, amount);

      return result;
    } catch (error: any) {
      return "There was an error transferring the funds: " + error.message;
    }
  },
  get_transaction_history: async ({ accountName }) => {
    if (!accountName || accountName === "") {
      return "Please provide an account name";
    }
    const accountNames = await getAccountNames();
    const hasAccount = accountNames.includes(accountName);
    if (!hasAccount) {
      return `You don't have access to ${accountName}. You can access one of the following accounts: ${accountNames.join(",")}`;
    }
    try {
      const history = await getTransactionHistory(accountName);
      if (history.length === 0) {
        return `No transaction history found for account ${accountName}`;
      }
      return JSON.stringify(history);
    } catch (err: any) {
      return `Error fetching transaction history: ${err.message}`;
    }
  },
  fund_account: async ({ accountName }) => {
    const accountNames = await getAccountNames();
    const hasAccessToFromAccount = accountNames.includes(accountName);
    if (!hasAccessToFromAccount) {
      return `You don't have access to ${accountName}. These are the accounts you can fund: ${accountNames.join(",")}`;
    }
    return await fundAccount(accountName);
  },
  getAccountNames: async () => {
    return JSON.stringify(await getAccountNames());
  },
  importAccount: async ({ accountName, privateKey }) => {
    await importAccount(accountName, privateKey);
    return `Imported account ${accountName}`;
  },
  getAccountNamesAndBalances: async () => {
    const ft_metadata = await getFtMetadata();
    return JSON.stringify((await getAccounts()).map((account) => ({
        name: account.name,
        balance: account.availableBalance,
        symbol: ft_metadata.symbol
      }))
    );
  },
  whatAmILookingAt: async () => {
    return await getMainComponentInfo();
  },
};

export const toolDefinitions: ToolsDefinition = [
  {
    type: "function",
    name: "show_account_overview",
    description: "show the account overview user interface",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    type: "function",
    name: "transfer",
    description: "transfer BANQ tokens from one account to another",
    parameters: {
      type: "object",
      properties: {
        fromName: {
          type: "string",
          description: "the name of the account to transfer from",
        },
        toName: {
          type: "string",
          description: "the name of the account to transfer to",
        },
        amount: {
          type: "number",
          description: "the amount to transfer",
        },
      },
      required: ["fromName", "toName", "amount"],
    },
  },
  {
    type: "function",
    name: "show_account_history_overview",
    description:
      "show the account transaction history overview for a specific account",
    parameters: {
      type: "object",
      properties: {
        accountName: {
          type: "string",
          description: "the name of the account to show the history for",
        },
      },
      required: ["accountName"],
    },
  },
  {
    type: "function",
    name: "get_transaction_history",
    description: "return the transaction history for an account",
    parameters: {
      type: "object",
      properties: {
        accountName: {
          type: "string",
          description:
            "the name of the account to get the transaction history for",
        },
      },
      required: ["accountName"],
    },
  },
  {
    type: "function",
    name: "fund_account",
    description: "ask for funding an account with BANQ tokens",
    parameters: {
      type: "object",
      properties: {
        accountName: {
          type: "string",
          description: "the name of the account to receive the tokens",
        },
      },
      required: ["accountName"],
    },
  },
  {
    type: "function",
    name: "getAccountNames",
    description: "Fetches a list of account names",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    type: "function",
    name: "getAccountNamesAndBalances",
    description: "Fetches a list of account names and their balances",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    type: "function",
    name: "importAccount",
    description: "Import an account",
    parameters: {
      type: "object",
      properties: {
        accountName: {
          type: "string",
          description: "the name of the account to import",
        },
        privateKey: {
          type: "string",
          description: "the private key of the account to import",
        },
      },
      required: ["accountName", "privateKey"],
    },
  },
  {
    type: "function",
    name: "whatAmILookingAt",
    description: "Explain to the user what is currently being viewed",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];
