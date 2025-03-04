import styles from "./style.css?inline";
import { setMainWebComponent } from "../ui";
import { adjustAmount, getAccounts, getFtMetadata } from "../modules/account";

customElements.define(
  "account-overview",
  class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });

      const styleSheet = new CSSStyleSheet();
      styleSheet.replaceSync(styles);
      this.shadowRoot!.adoptedStyleSheets = [styleSheet];
      console.log("account overview");
    }

    async componentInfo() {
      return "This component shows the account overview, where you can see the current balances of your accounts. You may also click on an account name to see the transaction history.";
    }

    async connectedCallback() {
      const accountData = await getAccounts();
      const ft_metadata = await getFtMetadata();

      const assets = accountData.filter((account) => account.type === "asset");
      const liabilities = accountData.filter(
        (account) => account.type === "liability",
      );

      const totalAssets = assets.reduce(
        (sum, account) => sum + BigInt(account.ftBalance),
        0n,
      );
      const totalLiabilities = liabilities.reduce(
        (sum, account) => sum + BigInt(account.ftBalance),
        0n,
      );

      this.shadowRoot!.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Account Name</th>
            <th>Available Balance</th>
            <th>Currency</th>
          </tr>
        </thead>
        <tbody>
          ${assets
            .map(
              (account) => `
            <tr data-account-name="${account.name}" style="cursor: pointer;">
              <td>${account.name}</td>
              <td>${account.availableBalance}</td>
              <td>${ft_metadata.symbol} <img src="${ft_metadata.icon}" style="height: 20px"></td>
            </tr>
          `,
            )
            .join("")}
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>${adjustAmount(totalAssets)}</strong></td>
            <td>${ft_metadata.symbol} <img src="${ft_metadata.icon}" style="height: 20px"></td>
          </tr>          
        </tbody>
      </table>
    `;

      this.shadowRoot!.querySelectorAll("tr[data-account-name]").forEach(
        (row) => {
          row.addEventListener("click", () => {
            const accountName = row.getAttribute("data-account-name");
            const accountHistoryComponent =
              document.createElement("account-history");
            accountHistoryComponent.setAttribute(
              "data-account-name",
              accountName!,
            );
            setMainWebComponent(accountHistoryComponent);
          });
        },
      );
    }
  },
);
