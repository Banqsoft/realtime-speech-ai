import styles from "./style.css?inline";
import { getFtMetadata, getTransactionHistory } from "../modules/account";

class AccountHistoryComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(styles);
    this.shadowRoot!.adoptedStyleSheets = [styleSheet];
  }

  async connectedCallback() {
    const accountName = this.dataset.accountName;
    if (!accountName) {
      this.shadowRoot!.innerHTML = "";
      return;
    }
    try {
      const history = await getTransactionHistory(accountName);

      const ft_metadata = await getFtMetadata();
      this.shadowRoot!.innerHTML = `
        <h2>Account History for ${accountName}</h2>
    
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Memo</th>
            </tr>
          </thead>
          <tbody>
            ${history
              .map(
                (transaction) => `
              <tr>
                <td>${transaction.date.toJSON().substring(0, "yyyy-MM-dd HH:MM".length).split("T").join(" ")}</td>
                <td>${transaction.amount}</td>
                <td>${ft_metadata.symbol} <img src="${ft_metadata.icon}" style="height: 20px"></td>
                <td>${transaction.memo}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `;
    } catch (error: any) {
      this.shadowRoot!.innerHTML = `
          <h2>Error fetching account history</h2>
          <p>${error.message}</p>
        `;
    }
  }

  async componentInfo() {
    return (
      "This component shows the transaction history of the account " +
      this.dataset.accountName
    );
  }
}

customElements.define("account-history", AccountHistoryComponent);
